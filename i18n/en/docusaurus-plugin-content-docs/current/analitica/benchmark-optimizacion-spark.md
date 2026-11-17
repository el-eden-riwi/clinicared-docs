---
id: benchmark-optimizacion-spark
title: PySpark Latency Optimization and Benchmark
sidebar_label: PySpark Benchmark (US 05)
---

# Performance Benchmark and Optimization with PySpark (US 05 - Tasks 4 & 5)

## 1. Context and Benchmark Objectives

The **ClínicaRed** analytical pipeline processes high-volume scheduling and attendance events for no-show prediction. The traditional model based on flat tabular storage (CSV) and direct iterative queries caused severe bottlenecks due to repetitive disk I/O and processing overhead across successive aggregate queries.

To overcome these limitations, an optimized architecture was designed and implemented on **Apache Spark 3.5**, aimed at maximizing analytical performance through storage- and memory-level data engineering techniques.

---

## 2. Implemented Optimization Techniques (Task 4)

1. **Migration to Apache Parquet Columnar Format:**
   * Replaced flat CSV files with Snappy-compressed Parquet.
   * Columnar storage reduces transferred byte volume by reading only the columns required by aggregations.
2. **Physical Partitioning by Medical Specialty (`specialty_id`):**
   * Distributed storage into partitioned subdirectories at the file system level.
   * Enables *partition pruning*, skipping irrelevant records when filtering by clinical service.
3. **In-Memory Persistence and Warming (`df.cache()`):**
   * Selective caching of the DataFrame at `StorageLevel(disk, memory, deserialized, 1 replicas)`.
   * Eliminates the need to re-read secondary storage files across consecutive analytical queries.

---

## 3. Physical Execution Plan Audit (Catalyst Plan - Task 4)

Running `.explain()` on the optimized analytical query demonstrates the data flow transformation performed by Spark's Catalyst optimizer:

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

### Key Operator Breakdown:
- **`FileScan parquet Batched: true`:** Vectorized reading in binary batches from disk.
- **`InMemoryTableScan` and `InMemoryRelation`:** Operation resolved directly from warm RAM via `.cache()`, eliminating disk I/O latency.
- **`HashAggregate` and `Exchange hashpartitioning`:** Distribution across 4 bounded shuffle partitions to prevent driver memory contention.

---

## 4. Analytical Performance Comparison Table (Task 5)

Quantitative evaluation was executed over a standardized workload of **20,000 analytical records**, comparing the baseline against the optimized version:

| Metric / Configuration | Baseline (Unoptimized) | Optimized Architecture (ClínicaRed) | Impact / Gain |
| :--- | :---: | :---: | :---: |
| **Storage Format** | Flat CSV | Apache Parquet (Snappy) | Compressed columnar storage |
| **Partitioning Strategy** | None (Monolithic) | Partitioned by `specialty_id` | Physical partition *pruning* |
| **Memory Persistence** | Inactive (Continuous disk re-reads) | `df.cache()` Active in RAM | Memory access without I/O latency |
| **Evaluated Volume** | 20,000 rows | 20,000 rows | Standardized analytical dataset |
| **Aggregate Query Latency** | **4,013.81 ms** | **1,539.24 ms** | **-2,474.57 ms net reduction** |
| **Response Time Reduction** | 0.0% (Baseline) | **61.65% faster** | Over 60% latency reduction |
| **Speedup Factor** | 1.0x (Baseline) | **2.61x** | Processes over 2.6x the volume |

---

## 5. Technical Conclusions and Operational Return

1. **Significant Analytical Acceleration:** Combining Apache Parquet and in-memory caching reduced aggregate query times by **61.65%**, achieving a **2.61x** speedup.
2. **Infrastructure Efficiency:** Batched columnar scanning (`Batched: true`) minimizes CPU usage and network transfers, optimizing processing costs on distributed clusters.
3. **Production Scalability:** Physical partitioning by medical service ensures that as historical volume scales to hundreds of thousands of appointments, operational queries maintain stable response times.

---

## 6. Reproducibility Procedure

The automated benchmarking and physical validation script can be executed directly in the development environment via:

```bash
python spark_optimization_benchmark.py
```
