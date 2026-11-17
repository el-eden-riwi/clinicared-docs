---
title: 003 - Incremental Extraction
---

# ADR 003: Watermark-Based Incremental Extraction Strategy

- **Status:** Accepted
- **Date:** 2026-10-15

## Context
As the volume of medical appointments (`appointments`) and patients (`patients`) grows in the operational database, performing full extractions (*Full Loads*) into the analytical layer will negatively impact transactional engine performance and increase processing times.

## Decision
Implement an **Incremental Extraction** pattern based on watermarks using audit timestamp columns (`created_at` / `updated_at`):
- Filter records using bounded intervals (`WHERE updated_at >= :watermark_start AND updated_at < :watermark_end`).
- Sort deterministically (`ORDER BY updated_at, id`) to prevent omissions on timestamp ties.
- Update the watermark state only after confirming the batch load completed successfully.

## Consequences
- **Positive:**
  * Drastic reduction in read load on PostgreSQL by extracting only new or modified records.
  * Safe failure recovery: if the pipeline fails, the watermark does not advance and the batch is safely reprocessed.
- **Negative / Risks:**
  * Requires guaranteeing at the database level that `updated_at` is reliably updated on every modification.
  * Does not detect physical deletions (`DELETE`), so cancellations or removals must be handled via logical statuses (e.g., `status = 'CANCELLED'`).
