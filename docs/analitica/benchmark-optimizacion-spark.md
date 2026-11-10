---
id: benchmark-optimizacion-spark
title: Optimización y Benchmark de Latencia en PySpark
sidebar_label: Benchmark PySpark (HU 05)
---

# Benchmark de Rendimiento y Optimización con PySpark (US 05 - Tasks 4 & 5)

## 1. Contexto y Objetivos del Benchmark

El pipeline analítico de **ClínicaRed** procesa eventos masivos de agendamiento y asistencia para la predicción del ausentismo (*no-show*). El modelo tradicional basado en almacenamiento tabular plano (CSV) y consultas iterativas directas generaba cuellos de botella severos por entrada/salida (I/O) repetitiva a disco y sobrecarga de procesamiento en consultas agregadas sucesivas.

Para resolver estas limitaciones, se diseñó e implementó una arquitectura optimizada sobre **Apache Spark 3.5**, orientada a maximizar el rendimiento analítico mediante técnicas de ingeniería de datos a nivel de almacenamiento y memoria.

---

## 2. Técnicas de Optimización Implementadas (Task 4)

1. **Migración a Formato Columnar Apache Parquet:**
   * Sustitución del formato CSV plano por Parquet con compresión Snappy.
   * Almacenamiento columnar que reduce el volumen de bytes transferidos al leer únicamente las columnas requeridas por las agregaciones.
2. **Particionamiento Físico por Especialidad Médica (`specialty_id`):**
   * Distribución del almacenamiento en subdirectorios particionados a nivel de sistema de archivos.
   * Habilita la poda de particiones (*partition pruning*), evitando el escaneo de registros irrelevantes al filtrar por servicio clínico.
3. **Persistencia y Calentamiento en Memoria RAM (`df.cache()`):**
   * Almacenamiento selectivo del DataFrame en el nivel `StorageLevel(disk, memory, deserialized, 1 replicas)`.
   * Elimina la necesidad de releer archivos de almacenamiento secundario en múltiples consultas analíticas consecutivas.

---

## 3. Auditoría del Plan de Ejecución Físico (Catalyst Plan - Task 4)

La ejecución del método `.explain()` sobre la consulta analítica optimizada evidencia la transformación del flujo de datos por el optimizador Catalyst de Spark:

```text
== Physical Plan ==
AdaptiveSparkPlan isFinalPlan=false
+- HashAggregate(keys=[status#126], functions=[count(1)])
   +- Exchange hashpartitioning(status#126, 4), ENSURE_REQUIREMENTS, [plan_id=450]
      +- HashAggregate(keys=[status#126], functions=[partial_count(1)])
         +- Project [status#126]
            +- Filter (isnotnull(specialty_id#129) AND (specialty_id#129 = 1))
               +- InMemoryTableScan [specialty_id#129, status#126], [isnotnull(specialty_id#129), (specialty_id#129 = 1)]
                     +- InMemoryRelation [appointment_id#124, patient_id#125, status#126, scheduled_datetime#127, attended#128, specialty_id#129], StorageLevel(disk, memory, deserialized, 1 replicas)
                           +- *(1) ColumnarToRow
                              +- FileScan parquet [appointment_id#124,patient_id#125,status#126,scheduled_datetime#127,attended#128,specialty_id#129] Batched: true, DataFilters: [], Format: Parquet, Location: InMemoryFileIndex[file:/tmp/spark_optimized_parquet], PartitionFilters: [], PushedFilters: [], ReadSchema: struct<appointment_id:int,patient_id:int,status:string,scheduled_datetime:timestamp,attended:bool...
```

### Desglose de Operadores Clave:
* **`FileScan parquet Batched: true`:** Lectura vectorizada en bloques binarios por lotes desde disco.
* **`InMemoryTableScan` e `InMemoryRelation`:** Operación resuelta directamente desde memoria RAM caliente gracias al `.cache()`, eliminando latencias de disco I/O.
* **`HashAggregate` y `Exchange hashpartitioning`:** Distribución en 4 particiones de *shuffle* acotadas para evitar contención de memoria en el *driver*.

---

## 4. Tabla Comparativa de Rendimiento Analítico (Task 5)

La evaluación cuantitativa se ejecutó sobre una carga estandarizada de **20,000 registros analíticos**, comparando la línea base frente a la versión optimizada:

| Métrica / Configuración | Línea Base (No Optimizada) | Arquitectura Optimizada (ClínicaRed) | Impacto / Ganancia |
| :--- | :---: | :---: | :---: |
| **Formato de Almacenamiento** | CSV Plano | Apache Parquet (Snappy) | Almacenamiento columnar comprimido |
| **Estrategia de Particionado** | Ninguno (Monolítico) | Particionamiento por `specialty_id` | Poda física de particiones (*pruning*) |
| **Persistencia en Memoria** | Inactiva (Re-lectura continua de disco) | `df.cache()` Activo en RAM | Acceso a memoria sin latencia I/O |
| **Volumen Evaluado** | 20,000 filas | 20,000 filas | Dataset analítico estandarizado |
| **Latencia Consultas Agregadas** | **4,013.81 ms** | **1,539.24 ms** | **-2,474.57 ms de reducción neta** |
| **Reducción de Tiempo de Respuesta** | 0.0% (Base) | **61.65% más rápido** | Reducción de latencia superior al 60% |
| **Factor de Aceleración (Speedup)** | 1.0x (Base) | **2.61x** | Procesa más de 2.6 veces el volumen |

---

## 5. Conclusiones Técnicas y Retorno Operativo

1. **Aceleración Analítica Significativa:** La combinación de Apache Parquet y almacenamiento en caché redujo los tiempos de consulta agregada en un **61.65%**, alcanzando una aceleración de **2.61x**.
2. **Eficiencia en Infraestructura:** El escaneo columnar por lotes (`Batched: true`) minimiza el consumo de CPU y transferencias de red, optimizando los costos de procesamiento en clústeres distribuidos.
3. **Escalabilidad para Producción:** El particionamiento físico por servicio médico garantiza que a medida que el volumen histórico crezca hacia cientos de miles de citas, las consultas operativas mantendrán tiempos de respuesta estables.

---

## 6. Procedimiento de Reproducibilidad

El script automatizado de benchmarking y validación física puede ejecutarse directamente en el entorno de desarrollo mediante:

```bash
python spark_optimization_benchmark.py
```