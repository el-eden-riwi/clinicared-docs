---
title: ADR 004 - Network Design (VPC) and Zero Cost
sidebar_position: 4
---

# ADR 004: Network Design (VPC), Isolation, and Zero-Cost Strategy

## Status
Accepted

## Context
The ClínicaRed system processes Protected Health Information (PHI). A strict requirement is isolating components that handle this data within protected network segments without direct exposure to the public Internet. At the same time, the project requires finding the **cost-optimal** solution (maximizing the AWS Free Tier).

Private subnets need outbound Internet access to pull container images (ECR) and communicate with the external SMS provider, requiring a Network Address Translation (NAT) mechanism.

## Evaluated Alternatives (Cost Control)

* **Option A: AWS Managed NAT Gateway.** The AWS-recommended solution for production. Provides high availability and automatic scaling.
  * *Estimated cost:* ~$32.00 USD/month per AZ (just for provisioning) + cost per GB processed.
* **Option B: NAT Instance (EC2).** Deploy an EC2 instance using a specialized AMI configured to route traffic (NAT), placed inside the public subnet.
  * *Estimated cost:* $0.00 USD. Using a `t2.micro` or `t3.micro` instance fits within the 750 monthly hours of the AWS Free Tier.

## Decision
**Option B (NAT Instance on EC2)** is selected.

A network architecture will be implemented within a single Virtual Private Cloud (VPC) using the following topology to ensure strict isolation without incurring network provisioning costs:

1. **Public Layer (Public Subnets):** Hosts the Application Load Balancer (ALB) and the `t2.micro` EC2 instance configured as a NAT Instance. Accesses the Internet through an Internet Gateway (IGW).
2. **Private Application Layer (Private App Subnets):** No public IPs. Hosts the API containers (Fargate) and Airflow. Outbound Internet traffic is routed through the NAT Instance.
3. **Private Data Layer (Private Data Subnets):** Strictly isolated. Hosts the relational database (Amazon RDS PostgreSQL). Has no outbound route to the Internet under any circumstances.

### Security Groups (SGs) Strategy (Least Privilege)
1. `ALB-SG`: Allows inbound HTTP (80) traffic from the Internet.
2. `NAT-Instance-SG`: Allows HTTP/HTTPS (80/443) traffic solely from private subnets.
3. `App-SG`: Allows traffic on port 8000 exclusively from `ALB-SG`.
4. `DB-SG`: Allows traffic on port 5432 exclusively from `App-SG`.

## Consequences
* **Positive:** Complies with data protection standards (isolated PHI) and reduces network infrastructure costs from ~$64/month to **$0.00**, meeting US 03 criteria and the AWS Pricing Calculator analysis.
* **Negative:** Unlike a managed NAT Gateway, a NAT Instance can become a bottleneck under massive traffic and requires team maintenance on the EC2 instance (patches, reboots). This trade-off is acceptable given the current project scale and cost-optimization priority.
