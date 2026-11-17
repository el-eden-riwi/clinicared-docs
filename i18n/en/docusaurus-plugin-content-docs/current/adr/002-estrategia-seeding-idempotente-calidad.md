---
title: 002 - Seeding Strategy
---

# ADR 002: Idempotent Data Seeding Strategy and Controlled Defect Injection

- **Status:** Accepted
- **Date:** 2026-10-15

## Context
To develop and validate both the backend and data pipelines of ClínicaRed, realistic synthetic data (patients, physicians, appointments) is required without exposing Protected Health Information (PHI/PII). Furthermore, the architecture must be tested against corrupted or incomplete records.

## Decision
Implement a Python data generator (`generate_seed.py`) using `Faker` and `psycopg2` under two core design principles:
1. **Idempotency:** Controlled cleanup (`TRUNCATE ... RESTART IDENTITY CASCADE`) prior to each insertion to ensure multiple runs produce a consistent, predictable state.
2. **Configurable Defect Injection:** Inclusion of a parameterized anomaly rate to evaluate how transactional schema constraints (`NOT NULL`, `UNIQUE`) behave against analytical pipeline validations.

## Consequences
- **Positive:**
  * Any developer can recreate the exact database state with a single command.
  * Allows switching between strict source validation mode (0% defects) and data resilience testing.
- **Negative / Risks:**
  * The seeding script is destructive by design, so its execution must be strictly restricted to development and testing environments (`DEV`/`QA`).
