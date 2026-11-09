---
id: adr-008-separacion-repositorios
title: ADR 008 - Separación de Repositorios (Backend vs Orquestación)
sidebar_label: 008 - Separación Repos
tags: [adr, architecture, devops]
---

# ADR 008: Separación Física de Repositorios

## Contexto
Mezclar APIs síncronas en tiempo real con motores ETL y orquestadores asíncronos satura el hardware durante el desarrollo local e infringe el principio de responsabilidad única.

## Decisión
Dividir el sistema en dos dominios físicos aislados: `clinicared-backend` (FastAPI) exclusivo para respuestas síncronas y reglas de negocio, y `clinicared-orquestacion` (Airflow, Celery, Spark, RabbitMQ) para tareas asíncronas y por lotes.

## Consecuencias
- **Positivas:** Se optimiza el consumo de CPU y RAM, permitiendo encender solo la porción del sistema que se va a desarrollar o testear.
- **Negativas:** Obliga a mantener contratos de datos estrictos (como los CSV exportados o bases de datos compartidas) para que ambos ecosistemas logren interoperar sin romperse.