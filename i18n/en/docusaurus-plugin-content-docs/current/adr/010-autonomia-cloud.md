---
id: adr-010-autonomia-cloud
title: "ADR 010: Roadmap to Full Cloud Autonomy (24/7 Orchestration)"
sidebar_label: "ADR 010: Cloud Autonomy (Phase 2)"
---

# ADR 010: Roadmap to Full Cloud Autonomy (24/7 Orchestration)

- **Status:** Proposed (Planned for Future Release — Phase 2)
- **Date:** 2026-11-12
- **Relation:** Extends **ADR 005** (Serverless AWS Fargate + ALB + RDS Infrastructure)

## Context

In Phase 1 (**ADR 005**), ClínicaRed consolidated a cost-optimized hybrid architecture with real cloud persistence:

1. **Transactional and Persistence Layer on AWS (`us-east-2`):** FastAPI backend deployed on **AWS ECS Fargate** behind an **Application Load Balancer (ALB)** connected to **PostgreSQL on Amazon RDS (`db.t3.micro`)**, managing patients, appointments, attendances, and idempotency in real time.
2. **On-Demand Orchestration, Analytics, and Presentation Layer:** Apache Airflow, PySpark, RabbitMQ, and the React/Vite client run in local Docker containers integrated via REST API (`POST /dagRuns` with Basic Auth and CORS), enabling analytical ETL execution over live RDS data without incurring continuous 24/7 compute costs.

Although this design eliminates mocked data and keeps additional spend at **$0.00 USD/month** during validation, scheduled DAGs (`@hourly`, `@daily`, `*/30`) and the RabbitMQ broker rely on the local workstation remaining powered on.

## Decision

For a **future commercial production launch (Phase 2)**, local components will be migrated to managed services and dedicated compute in AWS to achieve **24/7 operational autonomy**:

1. **Public Frontend on CDN:** Deploy `clinicared-frontend` on **Vercel** or **GitHub Pages** with automated static builds via CI/CD.
2. **TLS/HTTPS Termination with AWS CloudFront:** Place an **Amazon CloudFront** distribution in front of the Application Load Balancer (`clinicared-alb`) to enable end-to-end `HTTPS` encryption and prevent Mixed Content blocks in public browsers.
3. **Orchestration and Messaging on Amazon EC2:** Provision an **Amazon EC2 Ubuntu (`t3.medium` — 2 vCPU, 4 GB RAM, 30 GB EBS)** instance inside the same AWS VPC to host the `clinicared-orquestacion` stack (Apache Airflow, PySpark, and RabbitMQ) with an automatic restart policy (`restart: always`).
4. **Private Connectivity Fargate ↔ RabbitMQ:** Update the `RABBITMQ_HOST` environment variable in the ECS Fargate task definition to point to the private IP of the EC2 instance within the same *Security Group*, enabling continuous asynchronous queuing without manual intervention.

## Financial Impact and Trade-offs (Comparison vs. ADR 005)

| Component | Current Phase 1 (ADR 005) | Autonomous 24/7 Phase 2 (ADR 010) |
| :--- | :--- | :--- |
| **Backend + ALB + RDS (`us-east-2`)** | ~$50.12 USD/month (offset by credits / on-demand shutdown) | ~$50.12 USD/month |
| **Frontend + HTTPS (CloudFront)** | Local (`localhost:5173`) — $0.00 USD | Vercel / GitHub Pages + CloudFront Free Tier — **$0.00 USD** |
| **Orchestration (Airflow + Spark + RabbitMQ)** | On-demand local Docker — $0.00 USD | EC2 `t3.medium` + 30 GB EBS (730 hrs/month) — **~$32.80 USD/month** |
| **DAG and Queue Availability** | On-demand (requires local workstation running) | **Autonomous 24/7 in the cloud** |

## Activation Criteria

This migration will be executed when ClínicaRed transitions from validation to continuous clinical operation with concurrent external users, at which point the additional monthly budget for permanent orchestration compute will be approved.
