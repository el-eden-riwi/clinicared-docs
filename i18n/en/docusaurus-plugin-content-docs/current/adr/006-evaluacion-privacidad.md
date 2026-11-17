---
sidebar_position: 6
title: "006: Privacy Impact Assessment (PIA)"
---

# ADR 006 / PIA: Privacy Impact Assessment and Sensitive Data Handling

## 1. Context and Objective
As part of **Task 6** of the ClínicaRed project, this Privacy Impact Assessment (PIA) is conducted to identify, document, and mitigate risks associated with the flow, storage, and processing of sensitive patient data (medical records, credentials, and Personally Identifiable Information) within the AWS cloud architecture.

---

## 2. Sensitive Data Flows
The system handles Protected Health Information (PHI/PII), which follows a controlled and secure flow across infrastructure components:

1. **Capture and Transit (Client to Backend):**
   - Users (physicians, patients, administrators) interact with the interface and send encrypted HTTP requests via **HTTPS (TLS 1.2/1.3)**.
   - Traffic enters through the **Application Load Balancer (ALB)**, which securely terminates the SSL/TLS certificate.
2. **Processing (Application Layer on AWS ECS Fargate):**
   - Containers running on Fargate process requests inside a private network (private VPC Subnets).
   - No sensitive information is stored persistently inside containers (stateless architecture).
3. **Persistent Storage (Amazon RDS PostgreSQL Database):**
   - Relational data and medical records are stored on encrypted volumes within **Amazon RDS**.
   - Database access credentials are never hardcoded in source code; instead, they are managed via secure environment variables injected at runtime.

---

## 3. Identified Sensitive Data Matrix

| Data Element | Classification | Risk Level | Implemented Mitigation Measure |
| :--- | :--- | :--- | :--- |
| **User Credentials** (Passwords) | Confidential / Authentication | High | Secure hashing using strong cryptographic algorithms (such as bcrypt) prior to storage. |
| **Patient Identification Data** (Names, ID Number) | PII (Personally Identifiable Information) | High | Encrypted transit via HTTPS and access strictly restricted to authorized roles through the API. |
| **Medical Records & Clinical Histories** | PHI (Protected Health Information) | Critical | Isolation inside private RDS subnets without direct exposure to the public Internet. |

---

## 4. Residual Risk Analysis
Despite perimeter and network security controls implemented (such as VPCs and Security Groups), the following residual risks are identified and accepted along with their containment strategies:

1. **Risk of breach via third-party access or leaked credentials:**
   - *Mitigation:* AWS access keys (AWS CLI/IAM) are kept strictly outside the source code repository (`~/.aws/`), and least-privilege IAM policies are enforced.
2. **Risk of database exposure:**
   - *Mitigation:* Amazon RDS is deployed inside a private subnet, preventing direct external access. Only authorized Fargate backend containers permitted by Security Groups can communicate with the database port.
3. **Risk of audit log loss:**
   - *Mitigation:* Centralization of system activity logs to ensure traceability of who accessed what information and when.

---

## 5. Conclusion
The architecture selected for the ClínicaRed project (ECS Fargate + RDS + ALB) provides proper isolation and the necessary security controls to guarantee privacy and regulatory compliance in handling sensitive medical data.
