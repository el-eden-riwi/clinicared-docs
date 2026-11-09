---
id: adr-007-pyspark
title: ADR 007 - PySpark para Motor de Riesgo
sidebar_label: 007 - PySpark Risk Engine
tags: [adr, data-engineering, pyspark, batch]
---

# ADR 007: Uso de PySpark con Esquemas Estrictos para Procesos Batch

## Contexto
El motor de riesgo de ClínicaRed debe procesar el historial de los pacientes, cruzar citas, descartar nulos y agregar métricas, sin saturar la base de datos transaccional con consultas analíticas pesadas.

## Decisión
Implementar PySpark con validación de esquemas explícitos (`StructType`) en lugar de Pandas o SQL puro, ejecutándolo de forma asilada mediante Apache Airflow para generar DataMarts operacionales ligeros.

## Consecuencias
- **Positivas:** Se garantiza la consistencia de datos desde la ingesta fallando rápido si llegan corruptos. Prepara el código para escalar masivamente en un clúster de Big Data en el futuro.
- **Negativas:** En el entorno local requiere ejecutar Spark en modo `local[*]` y gestionar cuidadosamente la memoria RAM temporal (TMPDIR) del sistema anfitrión, dado el límite de 8GB de RAM del hardware actual.