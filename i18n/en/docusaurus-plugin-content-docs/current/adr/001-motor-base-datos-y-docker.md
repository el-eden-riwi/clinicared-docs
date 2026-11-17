---
title: 001 - Database Engine and Docker
---

# ADR 001: Containerized PostgreSQL in Docker for the Transactional Layer

- **Status:** Accepted
- **Date:** 2026-10-15

## Context
The ClínicaRed project requires a robust relational database that guarantees referential integrity across locations, healthcare professionals, patients, and medical appointments. Additionally, the development team works in hybrid environments (Windows / WSL2 Ubuntu), which introduces friction due to local port conflicts, character encoding issues, and differences in native engine installations.

## Decision
Adopt **PostgreSQL 15 (`postgres:15-alpine` image)** deployed via **Docker Compose**, automating initial schema provisioning through the `/docker-entrypoint-initdb.d/` volume.

## Consequences
- **Positive:**
  * Full development environment parity without relying on local installations on the host operating system.
  * Automatic schema initialization (`01_init_schema.sql`) upon container startup.
  * Strict compliance with ACID properties and referential integrity (Foreign Keys and `NOT NULL` constraints).
- **Negative / Risks:**
  * Requires Docker to be running in the local workspace.
  * Requires managing persistent volumes (`pgdata`) to prevent data loss when restarting containers.
