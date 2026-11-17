---
id: adr-008-separacion-repositorios
title: ADR 008 - Repository Separation (Backend vs. Orchestration)
sidebar_label: 008 - Repo Separation
tags: [adr, architecture, devops]
---

# ADR 008: Physical Separation of Repositories

## Context
Mixing real-time synchronous APIs with ETL engines and asynchronous orchestrators saturates hardware during local development and violates the Single Responsibility Principle.

## Decision
Split the system into two isolated physical domains: `clinicared-backend` (FastAPI) dedicated exclusively to synchronous responses and business rules, and `clinicared-orquestacion` (Airflow, Celery, Spark, RabbitMQ) for asynchronous and batch tasks.

## Consequences
- **Positive:** Optimizes CPU and RAM consumption, allowing developers to spin up only the portion of the system being developed or tested.
- **Negative:** Requires maintaining strict data contracts (such as exported CSVs or shared database schemas) so both ecosystems interoperate without breaking.
