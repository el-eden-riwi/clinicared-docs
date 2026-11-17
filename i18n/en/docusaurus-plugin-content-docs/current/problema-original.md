---
title: The Original Problem
sidebar_position: 1
---

# Case Study: ClínicaRed Citas
**Reducing no-shows and optimizing schedules across an outpatient clinic network**

> **Note to the team:** This document describes a business problem, its rules, its data sources, and how work will be accepted. It deliberately does not prescribe how to solve it. Every technical decision (which service, how many resources, which pattern, which topology) is the team's responsibility and must be justified in writing.

## 📋 Project Fact Sheet

| Attribute | Detail |
| :--- | :--- |
| **Organization (fictional)** | ClínicaRed IPS - network of 22 outpatient clinics and 640 healthcare professionals |
| **Industry** | Healthcare |
| **Duration** | 6 weeks |
| **Suggested Team** | 3 to 4 members |
| **AWS Costs** | No predefined budget: the team must identify and justify the cost-optimal solution. |
| **Expected Scope** | Complete end-to-end solution: from data generation and ingestion to the BI dashboard, deployed on AWS. |
| **Document Type** | Problem statement. Does not include a solution: the team defines architecture, infrastructure, resources, and costs. |

---

## 1. Business Context
ClínicaRed serves over **400,000 patients** affiliated with various insurers across **22 clinic sites**. Roughly **9,000 appointments** are scheduled daily across general medicine, specialists, laboratory, and diagnostic imaging.

The no-show rate is **21%**. Every missed appointment represents paid clinical capacity that goes unbilled, while patients who genuinely need care wait an average of **18 days** to see a specialist.

Medical and financial leadership approved a project to build a platform that consolidates schedules, attendance histories, and communications, classifies no-show risk using explicit rules, and enables controlled overbooking and reminder policies.

---

## 2. Problem to Solve
Appointment data resides in each site's scheduling system; actual attendance is recorded in a separate admissions system; and SMS reminders are dispatched through an external provider that returns no structured feedback. Nobody knows which patients are most likely to miss appointments or which sites are under- or over-utilized.

These sources must be integrated with strict protection of sensitive health data, applying clinical and administrative scheduling rules, orchestrating reminders, and producing productivity KPIs by site and specialty.

### 2.1 Current Bottlenecks
- **21% no-show rate**; exceeding 30% in certain specialties.
- **Blanket reminders sent to everyone**, resulting in high cost and low impact.
- **Manual overbooking** that occasionally causes overcrowded waiting rooms.
- **Sensitive data** copied into spreadsheets without access controls.
- **Productivity metrics** calculated inconsistently at each site.

---

## 3. Business Objectives
1. **Reduce overall no-shows** to under 15% within six months.
2. **Cut reminder costs by 30%** by targeting patients based on risk.
3. **Increase effective occupancy** of specialist schedules to 90%.
4. **Ensure compliance** with health data protection regulations end-to-end.

---

## 4. Actors and Users

| Actor | System Need |
| :--- | :--- |
| **Medical Director** | Effective occupancy, no-show rates, and wait times by site and specialty. |
| **Schedule Coordinator** | Daily list of appointments with risk scores and permitted overbooking slots. |
| **Patient** | Confirm or cancel an appointment via a link or message reply. |
| **Messaging Provider** | Receive dispatch orders and return delivery status updates. |
| **Data Protection Officer** | Audit who accessed which records and when. |

---

## 5. Data Sources
The system must integrate all of the following sources. Sources marked as simulated must be built by the team following Section 5.2 specifications; their internal design is up to the team.

| ID | Source | Type | Access / Format | Frequency | Volume |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F1** | Medical Appointment No Shows | Kaggle CSV | `[kaggle.com/datasets/joniarroba/noshowappointments](https://kaggle.com/datasets/joniarroba/noshowappointments)` | One-time historical | ~110k appointments |
| **F2** | Scheduling system | Simulated DB | PostgreSQL: patients, professionals, sites, specialties, appointments. Populated via seed. | Continuous | ≥ 1M appointments in 12 months |
| **F3** | Admissions (actual attendance) | Simulated file | Daily CSV per site dropped in object storage | Daily (02:00) | 22 files/day |
| **F4** | SMS / WhatsApp provider | Simulated API | REST endpoint to send messages + status webhook (sent, delivered, read, failed, replied) | Continuous | ≥ 12k messages/day |
| **F5** | National holidays | Public API | Nager.Date (`date.nager.at`) | Annual | ~20 records/year |
| **F6** | Daily weather by clinic city | Public API | Open-Meteo | Daily | 22 sites |
| **F7** | Specialty & duration catalog | Flat file | CSV maintained by medical leadership | Monthly | `< 200 rows` |

### 5.1 External Source Details
- **F1** provides historical attendance behavior (age, gender, welfare support, chronic conditions, SMS received, lead days). The team must map it to the ClínicaRed model.
- **F1** contains negative ages and outliers; their cleansing treatment must be documented.
- **F6** is used to analyze whether weather influences no-show rates.

### 5.2 Simulated Source Specifications
> **⚠️ Mandatory: Data Seeding**
> All data in simulated databases must be generated via a versioned seed script in the repository. Manually loaded data or unscripted database dumps are not accepted.

The seed must:
1. Use a fixed random seed so data is reproducible.
2. Be idempotent (running it multiple times does not duplicate records).
3. Support volume parameterization (small dev mode and full mode).
4. Enforce referential integrity and a catalog consistent with simulated APIs and events.
5. Inject the data quality defects from Section 5.3 at a configurable rate.
6. Run both locally and against the AWS database.

- **F2:** Appointment generator with realistic distribution by specialty and time slot; includes reschedules and cancellations at varying lead times.
- **F3:** Per-site files with slightly varying formats (delimiters, character encodings, column names), including late or missing files.
- **F4:** API simulating variable latency, 5xx errors, and duplicate or out-of-order webhooks; must support simulated patient responses (`CONFIRM` / `CANCEL`).
- All patient data must be synthetic.

### 5.3 Known Data Quality Issues
Incoming data will contain the following defects (simulated sources must deliberately inject them at a configurable rate):
- Duplicate patients with variations in name or ID document.
- Appointments with a booking date later than the appointment date.
- Admission files referencing non-existent appointment IDs.
- Duplicate status webhooks or out-of-order states (`read -> sent`).
- Mixed character encodings (UTF-8 / Latin-1).

---

## 6. Business Rules
All rules are mandatory. Each rule must be traced to code and at least one automated test.

| ID | Business Rule |
| :--- | :--- |
| **RN-01** | An appointment counts as a "no-show" if no admission record exists within 20 minutes after the scheduled time and it was not cancelled at least 4 hours in advance. |
| **RN-02** | Rule-based risk classification (not ML): **High** if the patient has at least 2 no-shows in 6 months or the appointment was booked > 20 days ahead without confirmation; **Medium** if 1 no-show in 6 months or lead time > 10 days; **Low** otherwise. |
| **RN-03** | Reminders: **High** risk receives messages at 72h and 24h; **Medium** at 24h; **Low** receives no reminder unless it is their first visit. |
| **RN-04** | No messages are sent between 20:00 and 07:00 local time or on holidays; they are rescheduled to the next valid window. |
| **RN-05** | Overbooking: 1 extra slot is allowed for every 3 High-risk appointments in the same physician slot, up to a maximum of 2 extra slots per slot. Never allowed in specialties marked "non-overbookable" (F7). |
| **RN-06** | If a patient replies `CANCEL`, the appointment is released and the slot is offered to the waitlist within 10 minutes. |
| **RN-07** | A patient with 3 no-shows in 6 months enters "restricted scheduling": they may only book with mandatory prior confirmation. |
| **RN-08** | Effective occupancy = attended appointments / offered slots, by professional, site, and specialty. |
| **RN-09** | Clinical data (chronic conditions) may only exist in aggregated form in the analytical layer; never at an identifiable patient level. |
| **RN-10** | Every API access to patient information must be recorded in an immutable audit log. |
| **RN-11** | Appointments for minors are notified to the registered guardian, never to the minor. |

---

## 7. Functional Requirements

| ID | Requirement | Priority |
| :--- | :--- | :--- |
| **RF-01** | Integrate historical data (F1) and continuous operations (F2–F4) into a unified appointment and attendance repository. | High |
| **RF-02** | Calculate daily risk scores for every appointment over the next 7 days. | High |
| **RF-03** | Orchestrate reminder dispatches according to risk level and permitted hours. | High |
| **RF-04** | Receive and process messaging provider webhooks. | High |
| **RF-05** | Expose coordinator API: appointments with risk levels and permitted overbooking slots per time block. | High |
| **RF-06** | Release cancelled slots and offer them to the waitlist. | Medium |
| **RF-07** | Consolidate admission files even when arriving late or in varying formats. | High |
| **RF-08** | Record an audit trail of patient data access. | High |
| **RF-09** | Analytical model covering appointments, attendance, professionals, and sites. | High |

---

## 8. Non-Functional Requirements

| ID | Attribute | Measurable Requirement |
| :--- | :--- | :--- |
| **RNF-01** | Privacy | Identifiable data encrypted at rest and in transit; pseudonymization in the analytical layer. |
| **RNF-02** | Latency | Coordinator API p95 less than or equal to 400 ms. |
| **RNF-03** | Reliability | Zero duplicate reminders sent to patients even when processes retry. |
| **RNF-04** | Timeliness | Next-day risk scores computed before 05:00. |
| **RNF-05** | Availability | 99.5% webhook reception; if the receiver fails, status updates are never lost. |
| **RNF-06** | Retention | Audit logs retained for 5 years; operational data retained for 2 years in hot storage. |

---

## 9. Program Topics to Demonstrate
Mandatory topics in this project: **19 of 20**.

| # | Topic | Expected Evidence | Status |
| :--- | :--- | :--- | :--- |
| **1** | FastAPI I - REST APIs | Expose at least one OpenAPI/Swagger-documented REST API with CRUD operations, path/query parameters, and explicit request/response contracts. | Mandatory |
| **2** | FastAPI II - ORM & Best Practices | Relational persistence via ORM, typed model validation, proper HTTP status error handling, and justified layered architecture. | Mandatory |
| **3** | Docker I - Fundamentals | Each custom component packaged in a reproducible image with environment variables, `.dockerignore`, and size optimization evidence (before/after). | Mandatory |
| **4** | Docker II - Multi-container | Launch the entire local ecosystem with a single command, including networks, persistent volumes, and inter-service communication. | Mandatory |
| **5** | AWS I - Fundamentals | Least-privilege IAM account/role, justified region and AZs, AWS CLI usage, and cost analysis. | Mandatory |
| **6** | AWS II - Networking + EC2 | Custom network design (VPC, subnets, route tables, gateways, Security Groups) and at least one justified EC2 instance. Justify private subnets for health data. | Mandatory |
| **7** | AWS III - S3 + RDS | Object storage with justified lifecycle/storage classes (5-year audit retention), and managed DB with backups and secure connectivity. | Mandatory |
| **8** | AWS IV - ECR + ECS | Images pushed to a private registry and at least one service deployed on a container cluster with versioned task definitions. | Mandatory |
| **9** | AWS V - Fargate + ALB | Serverless container compute exposed behind a load balancer with health checks and centralized logs. | Mandatory |
| **10** | RabbitMQ | Asynchronous messaging (producers, consumers, exchanges, queues, routing keys, ACKs, and persistence). Decoupled send orders and webhooks without duplicates. | Mandatory |
| **11** | Airflow I - Fundamentals | Batch orchestration via DAGs with dependencies, retries, schedules, and parameters (daily risk, admission consolidation, and reminders). | Mandatory |
| **12** | Airflow II - Celery + RabbitMQ | Distributed task execution with containerized workers, broker, and metadata DB. | Mandatory |
| **13** | Spark I - Fundamentals | Distributed jobs with explicit schemas (non-inferred) and deliberate use of transformations and actions. | Mandatory |
| **14** | Spark II - Data Processing | Business transformations with projections, filters, derived columns, aggregations, joins, and functions. | Mandatory |
| **15** | Spark III - ETL + Performance | ETL pipeline with partitioning, columnar format, caching, and measurable optimization evidence (execution times, shuffle, execution plans). | Mandatory |
| **16** | Spark + S3 + ECS/Fargate | Containerized jobs reading/writing S3 and running in the cloud on containers. | Mandatory |
| **17** | CI/CD I - Applications | Git workflow with branches and PRs; pipeline running linting, tests, build, image publish, and deployment. | Mandatory |
| **18** | CI/CD II - Data Engineering | Data pipeline featuring job tests, DAG validation, quality checks, and versioning. | Mandatory |
| **19** | EKS - Introduction | Deployment of at least one component on Kubernetes and comparative ECS vs. EKS analysis. | Optional (Bonus) |
| **20** | Architecture + Power BI + Final | End-to-end architecture, layered Data Lake, dimensional model, Power BI, observability, and executive presentation. | Mandatory |

---

## 10. What the Team Must Define

### 10.1 General Decisions
- End-to-end design and architecture with custom diagram (components, synchronous and asynchronous flows).
- AWS infrastructure (region, AZs, networking, security, IAM).
- Resource sizing (CPU, RAM, storage, replicas/workers) with supporting evidence.
- Monthly cost estimation (Dev and Prod) in AWS Pricing Calculator with explicit assumptions.
- Data strategy (Data Lake layers, formats, partitioning, dimensional model).
- Deployment strategy, secrets management, rollback, and observability (metrics, logs, alarms).
- Architecture Decision Records (ADRs) documenting evaluated alternatives.

### 10.2 Case-Specific Questions
1. How do you guarantee that a retry never sends the same reminder twice?
2. Which components touch identifiable data and how are they isolated via networking and IAM?
3. How is an immutable audit log implemented and how much does 5-year retention cost?
4. What happens if an admissions file arrives two days late? What gets recalculated?

---

## 11. Deliverables

| ID | Deliverable | Description | Week |
| :--- | :--- | :--- | :--- |
| **E-01** | Architecture Document | End-to-end logical/physical diagrams, components, flows, and at least 5 ADRs (v1 in W1, final in W6). | W1–W6 |
| **E-02** | Code Repository | Git repo with README, component structure, branches, and reviewed PRs. | W1–W6 |
| **E-03** | Data Seed | Versioned, fixed-seed, volume-parameterized, idempotent scripts with configurable defects. | W1 |
| **E-04** | Reproducible Local Env | Full ecosystem starts with a single documented command (including seeding). | W2 |
| **E-05** | Documented API(s) | Exported OpenAPI contract and test collection covering happy and error paths. | W2 |
| **E-06** | AWS Infrastructure Design | Network diagram, resource inventory, IAM policies, and justification. | W3 |
| **E-07** | Monthly Cost Analysis | AWS Pricing Calculator export + per-environment table, assumptions, and alternatives. | W3 & W6 |
| **E-08** | Data Pipelines | Versioned, parameterized, and idempotent DAGs and distributed jobs. | W4 |
| **E-09** | CI/CD Pipelines | App and data pipelines with evidence of successful and failed runs. | W5 |
| **E-10** | Dictionary & Dimensional Model | Table/field descriptions, data lineage, and dimensional diagram. | W6 |
| **E-11** | Power BI Dashboard | `.pbix` file and screenshots answering all business questions. | W6 |
| **E-12** | Operational Runbook | How to deploy, monitor, reprocess, scale, and recover from failures. | W6 |
| **E-13** | Performance Report | Before/after benchmarks for distributed processing and API latency. | W5 |
| **E-14** | End-to-End Demo & Presentation | Presentation (15m) + live AWS demo (15m) + Q&A (10m). | W6 |
| **E-15** | Privacy Impact Assessment | Inventory of sensitive data, data flows, controls, and residual risks. | W3 |
| **E-16** | Policy Simulation | Historical comparison of no-shows and costs with and without the policy. | W6 |

---

## 12. Acceptance Criteria

### 12.1 Case-Specific Criteria
- **CA-01:** An appointment with no admission after 21 minutes and no prior cancellation is marked as a no-show.
- **CA-02:** An appointment cancelled 3 hours ahead counts as a no-show; cancelled 5 hours ahead does not.
- **CA-03:** A patient with 2 no-shows in 6 months is assigned High risk and receives two reminders (72h and 24h).
- **CA-04:** A reminder scheduled for 21:00 is rescheduled to 07:00 on the next business day.
- **CA-05:** Retrying the dispatch process three times results in the patient receiving only one message per reminder.
- **CA-06:** The coordinator API never suggests overbooking for non-overbookable specialties.
- **CA-07:** Following a `CANCEL` reply, the slot becomes available to the waitlist in under 10 minutes.
- **CA-08:** Querying the analytical layer does not allow identifying an individual patient with a chronic condition.
- **CA-09:** Every API query of patient data generates an audit record with user, timestamp, and resource.
- **CA-10:** Admission files with Latin-1 encoding and `;` delimiters integrate cleanly.

### 12.2 Cross-Cutting Criteria
- **CT-01:** The entire ecosystem boots locally with a single command and a README enables setup in under 30 minutes.
- **CT-02:** No credentials or secrets exist in the repository or container images; CI fails if secrets are detected.
- **CT-03:** All infrastructure is tagged (`project`, `environment`, `owner`) and can be torn down and recreated.
- **CT-04:** The CI pipeline blocks merges to `main` if linting, tests, or DAG validation fail.
- **CT-05:** Cost analysis compares at least two alternatives with verifiable assumptions.
- **CT-06:** All simulated databases are populated exclusively via the seed (reproducible and duplicate-free).
- **CT-07:** The solution runs end-to-end on AWS through the Power BI dashboard during the live demo.
- **CT-08:** Batch processes are idempotent.
- **CT-09:** At least one alarm is configured and demonstrated live against a triggered failure.
- **CT-10:** The Power BI dashboard answers all business questions and reconciles with a control query.

---

## 13. Business Questions for the Dashboard (Power BI)
1. What is the no-show rate by site, specialty, time slot, day of the week, and age group?
2. What is the effective occupancy by professional and site?
3. What impact did reminders have by risk level?
4. How much do sent messages cost and how many no-shows did they prevent (estimated)?
5. How many overbooked slots were used and how many resulted in a collapsed waiting room (more than 3 waiting patients)?
6. Do weather or booking lead time influence no-show rates?

---

## 14. Constraints, Assumptions, and Out of Scope
- **Constraints:** Synthetic or public data only; explicit rule-based risk classification (no ML); components handling identifiable data placed in private networks.
- **Out of Scope:** Electronic Health Records (EHR), real SMS/WhatsApp provider integration, insurer billing.

---

## 15. Suggested Milestones and Evaluation Rubric

### Weekly Schedule
- **Week 1 (Discovery & Design):** Business rules, architecture v1, initial ADRs, operational model, and working seed.
- **Week 2 (Backend & Containers):** Simulated sources, persistent APIs, and single-command local multi-container setup.
- **Week 3 (AWS Fundamentals):** Networking, security, storage, RDS, ECR/ECS, and cost analysis v1.
- **Week 4 (Messaging, Orchestration & Processing):** Asynchronous flow (RabbitMQ), distributed Airflow DAGs, and initial Spark jobs.
- **Week 5 (Performance, CI/CD & Kubernetes):** Cloud-optimized ETL, app & data CI/CD, EKS component, and performance report.
- **Week 6 (End-to-End Integration & Closure):** AWS integration, dimensional model, Power BI, observability, final costs, runbook, and live demo.

### Evaluation Weights
- **Data Engineering:** 20%
- **Business & Rules Comprehension:** 15%
- **Architecture & Decisions:** 15%
- **AWS Infrastructure & Costs:** 15%
- **Analytics & Communication:** 15%
- **Backend & Messaging:** 10%
- **DevOps & CI/CD:** 10%

> **🚨 Penalties:** Exposed credentials (-15%), un-terminated infrastructure after demo incurring charges (-10%), demo failing to execute live (-10%), cost estimate lacking assumptions (-5%).
