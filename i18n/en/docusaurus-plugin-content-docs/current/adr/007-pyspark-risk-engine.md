---
id: adr-007-pyspark
title: ADR 007 - PySpark for Risk Engine
sidebar_label: 007 - PySpark Risk Engine
tags: [adr, data-engineering, pyspark, batch]
---

# ADR 007: Using PySpark with Strict Schemas for Batch Processing

## Context
The ClínicaRed risk engine must process patient histories, join appointment records, filter out nulls, and aggregate metrics without saturating the transactional database with heavy analytical queries.

## Decision
Implement PySpark with explicit schema validation (`StructType`) instead of Pandas or raw SQL, running it in isolation via Apache Airflow to generate lightweight operational Data Marts.

## Consequences
- **Positive:** Guarantees data consistency from ingestion by failing fast if corrupted data arrives. Prepares the codebase to scale massively onto a Big Data cluster in the future.
- **Negative:** In local environments, Spark must run in `local[*]` mode and temporary RAM (`TMPDIR`) on the host machine must be carefully managed due to the current 8 GB hardware RAM limit.
