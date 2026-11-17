---
id: adr-009-idempotencia-webhooks
title: ADR 009 - Idempotency Pattern in Webhooks and Messaging
sidebar_label: 009 - Webhook Idempotency
tags: [adr, backend, resilience, rabbitmq]
---

# ADR 009: Idempotency Pattern in Webhook Reception

## Context
Networks and messaging providers (SMS/Email) are inherently unreliable. The orchestrator may emit duplicate or out-of-order events when retrying failed tasks in RabbitMQ, which could cause patient spam or transactional corruption in the clinic (e.g., registering an admission twice).

## Decision
Validate unique idempotency keys (`idempotency_key`) on backend endpoints that process notifications, admissions, and risk calculations.

## Consequences
- **Positive:** Shields the system against accidental overbooking and duplicate messages.
- **Negative:** Adds an extra validation step in PostgreSQL before committing the transaction, slightly increasing API write latency.
