---
id: simulacion-politicas-recordatorio
title: Simulación Histórica de Políticas de Recordatorio
sidebar_label: Simulación de Políticas (HU 06)
---

# Simulación Histórica: Políticas de Recordatorio (US 06 - Task 3)

## 1. Contexto y Objetivo

El ausentismo a citas médicas (*no-show*) genera pérdidas operativas y capacidad ociosa en los consultorios. La práctica común consiste en enviar recordatorios por SMS a todos los pacientes agendados sin distinción, generando sobrecostos de mensajería y saturación en pacientes que históricamente asisten sin inconvenientes.

Esta simulación contrasta el impacto financiero y operativo de dos estrategias evaluadas sobre **100 citas históricas** y **50 pacientes** persistidos en PostgreSQL.

---

## 2. Definición de Políticas

* **Política A (Tradicional / Disparo Masivo):** Envío indiscriminado de SMS al 100% de las citas agendadas, asumiendo un costo fijo de **$0.05 USD** por mensaje saliente.
* **Política B (Analítica / Segmentación por Riesgo):** Envío focalizado exclusivamente a pacientes clasificados en riesgo **MEDIUM** o **HIGH** por el motor analítico de reglas de negocio (`src/services/risk_calculator.py`), prescindiendo de mensajes hacia pacientes cumplidos (**LOW**).

---

## 3. Resultados Cuantitativos

| Métrica Comparativa | Política A (Tradicional) | Política B (Analítica ClínicaRed) | Diferencia / Impacto |
| :--- | :---: | :---: | :---: |
| **Criterio de Notificación** | Todos los agendados (100%) | Segmentación por riesgo analítico | Optimización quirúrgica |
| **Volumen de SMS Enviados** | 100 mensajes | 46 mensajes | -54 envíos evitados |
| **Costo Total de Mensajería** | $5.00 USD | $2.30 USD | **$2.70 USD de ahorro neto** |
| **Porcentaje de Optimización de Costo** | 0.0% (Base) | **54.0%** | **54% de reducción en OPEX** |
| **Mensajes Innecesarios Evitados (Spam)** | 0 | 54 pacientes cumplidos | Reducción de fatiga de canal |
| **Cobertura sobre Pacientes Críticos** | 100% | 100% (46/46) | Sin pérdida de cobertura |

---

## 4. Distribución del Riesgo en el Dataset

* **Riesgo Bajo (LOW):** 54 citas (54.0%) — Pacientes con historial de asistencia regular; no requieren intervención adicional.
* **Riesgo Medio (MEDIUM):** 46 citas (46.0%) — Pacientes con antecedentes de inasistencia o ventanas amplias de inactividad; requieren alerta preventiva.
* **Riesgo Alto (HIGH):** 0 citas (0.0%) en esta ventana de prueba.

---

## 5. Conclusión Técnica y ROI

El motor analítico de **ClínicaRed** demostró que la segmentación predictiva genera una **reducción del 54% en costos operativos de mensajería**, manteniendo intacta la tasa de protección sobre pacientes propensos a inasistencia. Esta estrategia permite reasignar recursos hacia recordatorios multicanal más intensivos en pacientes con riesgo alto sin incrementar el presupuesto global.

---

## 6. Reproducibilidad

El script de benchmarking puede ejecutarse directamente contra la base de datos PostgreSQL local o desplegada en AWS RDS con el siguiente comando:

```bash
python simulacion_politicas.py