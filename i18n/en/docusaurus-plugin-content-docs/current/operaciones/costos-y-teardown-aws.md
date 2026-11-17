---
id: costos-y-teardown-aws
title: AWS Cost Management and Teardown Protocol
sidebar_label: Costs & Teardown (US 06 - Task 6)
---

# AWS Cost Management and Teardown Protocol (US 06 - Task 6)

## 1. Context and Operational Objectives

The deployment of the **ClínicaRed** ecosystem on Amazon Web Services (AWS) implements a decoupled, serverless container model within the **US East (Ohio / `us-east-2`)** region.

This document formalizes the monthly budget derived from the **AWS Pricing Calculator** for production services, establishes off-hours cost-saving strategies, and defines the standard teardown protocol via AWS CLI to prevent charges from idle resources.

---

## 2. Official Monthly Budget (AWS Pricing Calculator)

Infrastructure sizing covers the transactional requirements of the FastAPI backend and data persistence:

| AWS Service | Resource Type / Technical Configuration | Monthly Cost |
| :--- | :--- | :---: |
| **AWS Fargate** | 1 Continuous Task (Linux x86, 1 GB RAM, 20 GB ephemeral storage, 730 hrs/month) | **$18.02 USD** |
| **Application Load Balancer** | 1 Dedicated ALB for SSL termination, routing, and health checks | **$16.66 USD** |
| **Amazon RDS for PostgreSQL** | `db.t3.micro` instance, 20 GB gp2 SSD storage, Single-AZ (730 hrs/month) | **$15.44 USD** |
| **Upfront Cost** | On-Demand model with no long-term commitment | **$0.00 USD** |
| **ESTIMATED MONTHLY TOTAL** | **Full ClínicaRed Architecture (24/7)** | **$50.12 USD / month** |

---

## 3. FinOps Strategy: Development / Business Hours Mode

For testing environments, academic validations, and audits that do not require continuous availability (730 hours/month), an off-hours scheduled shutdown policy is applied (estimated at 240 hours/month):

- **AWS Fargate (240 hrs/month):** ~$5.92 USD.
- **Amazon RDS PostgreSQL (Stopped off-hours):** ~$6.50 USD (billed solely for 20 GB gp2 storage retention).
- **Application Load Balancer (Paused or deleted between sessions):** ~$5.47 USD.
- **Reduced Monthly Budget:** **~$17.89 USD / month** (**64.3%** reduction compared to continuous execution).

---

## 4. Teardown Protocol with AWS CLI

At the end of each test session or evaluation cycle, execute the following protocol in strict sequential order with credentials configured for `us-east-2`:

### Step 1: Scale Fargate Tasks to Zero
Immediately stops serverless CPU and memory billing:
```bash
aws ecs update-service \
    --cluster clinicared-cluster \
    --service clinicared-backend-service \
    --desired-count 0 \
    --region us-east-2
```

### Step 2: Delete the Application Load Balancer
The load balancer incurs a fixed hourly charge ($0.0225/hour) even with zero traffic. Release it after extended test sessions:
```bash
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names clinicared-alb \
    --region us-east-2 \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

if [ "$ALB_ARN" != "None" ] && [ -n "$ALB_ARN" ]; then
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" --region us-east-2
    echo "Application Load Balancer clinicared-alb successfully deleted."
fi
```

### Step 3: Stop or Delete the RDS Database
- **Temporarily stop (up to 7 consecutive days):**
  ```bash
  aws rds stop-db-instance \
      --db-instance-identifier clinicared-db \
      --region us-east-2
  ```
- **Permanently delete while preserving a final safety snapshot:**
  ```bash
  aws rds delete-db-instance \
      --db-instance-identifier clinicared-db \
      --final-db-snapshot-identifier clinicared-db-final-snapshot \
      --region us-east-2
  ```

### Step 4: Purge Obsolete Images in Amazon ECR
Removes intermediate or untagged images to avoid residual registry storage charges:
```bash
aws ecr batch-delete-image \
    --repository-name clinicared-backend \
    --image-ids "$(aws ecr list-images --repository-name clinicared-backend --region us-east-2 --filter tagStatus=UNTAGGED --query 'imageIds[*]' --output json)" \
    --region us-east-2
```

### Step 5: Clean Up CloudWatch Logs
Removes the log group generated during testing to free storage:
```bash
aws logs delete-log-group \
    --log-group-name /ecs/clinicared-backend \
    --region us-east-2
```

---

## 5. Closing Audit Checklist

Before ending the work session, verify via the AWS Console or CLI:

- [ ] Fargate tasks in `STOPPED` state (Count = 0).
- [ ] Application Load Balancer (`clinicared-alb`) removed from the VPC.
- [ ] RDS instance in `stopped` state or deleted with a saved snapshot.
- [ ] No unassociated Elastic IPs remaining in the account.
- [ ] **AWS Cost Explorer** dashboard verified with no unexpected active spend.
