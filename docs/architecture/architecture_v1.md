---
title: Arquitectura v1
---

# Arquitectura End-to-End v1 - ClínicaRed Citas

## 1. Visión General
El sistema **ClínicaRed Citas** implementa una arquitectura híbrida que separa el procesamiento transaccional (OLTP) del flujo analítico de ingeniería de datos (OLAP). El diseño garantiza alta disponibilidad en la gestión de citas médicas, seguimiento de asistencia y mensajería, trazabilidad de calidad de datos y escalabilidad mediante contenedores.

## 2. Diagrama de Arquitectura (v1)

```mermaid
flowchart LR
    subgraph Generacion ["1. Generación y Origen (OLTP)"]
        SEED["Seeder Idempotente\n(Python + Faker)"]
        API["Backend API\n(Gestión de Citas y Notificaciones)"]
        PG[("PostgreSQL 15\nclinicared_db\n(Docker)")]
    end

    subgraph Ingesta ["2. Extracción Incremental (ETL/ELT)"]
        EXT["Extractor Incremental\n(Watermark: updated_at / created_at)"]
    end

    subgraph Lakehouse ["3. Procesamiento y Calidad (Medallion)"]
        RAW["Capa Bronze (Raw)\nDatos Crudos"]
        CLEAN["Capa Silver (Clean)\nReglas de Calidad y Limpieza"]
        GOLD["Capa Gold (Marts)\nModelo Dimensional (Star Schema)"]
    end

    subgraph Consumo ["4. Consumo y BI"]
        BI["Dashboards Analíticos\n(KPIs de Citas, Asistencia y Sedes)"]
    end

    SEED -->|Inyección controlada| PG
    API -->|Operaciones CRUD| PG
    PG -->|Extracción por intervalo| EXT
    EXT --> RAW
    RAW -->|Validación y Deduplicación| CLEAN
    CLEAN -->|Agregación de Negocio| GOLD
    GOLD --> BI