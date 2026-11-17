---
sidebar_position: 5
title: Tablero Analítico ClínicaRed
description: Documentación funcional, métricas clave y descarga del paquete comprimido (.zip) del modelo analítico en Power BI de ClínicaRed.
---

# Tablero Analítico: Gestión de Citas ClínicaRed

Este documento detalla la arquitectura funcional, los indicadores clave de desempeño (KPIs) y los hallazgos principales del tablero de **Power BI** diseñado para analizar la operación de agendamiento, inasistencia, ocupación y calidad de datos de **ClínicaRed** (sobre un volumen auditado de **421,772 citas cargadas**).

---

## 📥 Descarga del paquete Power BI (`.zip`)

Para explorar los filtros dinámicos por **Mes (`anio_mes`)** y **Sede**, inspeccionar el modelo de datos o revisar las medidas DAX, descarga el archivo comprimido con el proyecto completo:

:::tip Archivo Fuente Disponible

[**⬇️ Descargar ClinicaRed_PowerBI_v2.zip (15.2 MB)**](/files/ClinicaRed_PowerBI_v2.zip)

:::

*Instrucciones: Descomprime el archivo `.zip` en tu equipo y abre el archivo `.pbix` contenido en su interior utilizando **Microsoft Power BI Desktop**.*

---

## 📊 Estructura y Páginas del Tablero

El informe está organizado en **7 vistas interactivas** accesibles desde el menú superior de navegación, permitiendo evaluar el impacto de las políticas operativas implementadas a partir de mayo de 2026 (**2026-05**).

### 1. Resumen Ejecutivo
Consolida el estado general de la operación frente a las metas estratégicas definidas por la organización:
* **Tasa de Inasistencia:** **20.82%** (Meta: `≤ 16%`). Aunque aún supera el objetivo, muestra una reducción notable tras la política de `2026-05`, destacando una caída en pacientes de **riesgo alto** del **48.3% (PRE)** al **24.9% (POST)**.
* **Costo de Recordatorios:** **$8.26M** (Meta: `≤ $10M`). Meta cumplida gracias a la optimización de canales.
* **Ocupación de Especialistas:** **69.39%** (Meta: `≥ 80%`).
* **Lista de Espera (`< 10 min`):** **52.6%**
* **Control ET-58:** Validación positiva (`Cumple con consulta de control`) sobre los **421,772 registros**.

### 2. Inasistencia
Responde a la pregunta *¿dónde y cuándo faltan los pacientes?* segmentando por ubicación, especialidad y perfil demográfico:
* **Por Sede:** Las mayores tasas se concentran en **Sede Norte Barranquilla (25.1%)**, **Sede Bello (22.0%)** y **Sede Chapinero Bogotá (22.1%)**.
* **Por Especialidad:** Lideran **Psiquiatría (24.0%)**, **Dermatología (24.7%)** y **Psicología (22.8%)**, frente a Medicina General (21.6%).
* **Mapa de Calor (Día x Franja):** El pico crítico de ausentismo ocurre los **lunes de 07:00 a 08:00 (27.9%)** y los **sábados en la primera franja (25.7%)**.
* **Grupo Etario:** Los jóvenes adultos de **18 a 29 años** presentan la mayor inasistencia (**25.0%**), mientras que el grupo de **60 a 74 años** es el más cumplido (**17.7%**).

### 3. Ocupación Efectiva
Evalúa la relación entre citas atendidas y cupos ofertados (Regla de Negocio **RN-02**):
* **Desempeño por Categoría (PRE vs POST):** Todas las categorías mejoraron tras la política: **Imágenes Diagnósticas (74.5%)**, **Medicina General (70.1%)**, **Especialista (68.5%)** y **Laboratorio (65.7%)**.
* **Desglose Operativo:** Permite expandir cada sede (ej. *Chapinero Bogotá*, *Centro Barranquilla*, *Bello*) para auditar cupos ofertados vs. citas atendidas por profesional de la salud.

### 4. Recordatorios y Costos
Analiza el retorno de inversión y la efectividad de la mensajería multicanal (SMS y WhatsApp):
* **Volumen y Eficiencia:** Se enviaron **376,914 mensajes** con un costo total de **$8,260,940 COP**.
* **Impacto Evitado:** Se estiman **14,682 inasistencias evitadas**, a un costo unitario de **$481.2 COP por cita rescatada**.
* **Efectividad por Riesgo:** En pacientes de **riesgo alto**, la inasistencia cae del **72.3% (sin recordatorio)** al **33.6% (con recordatorio)**.
* **Ahorro por Canal:** A partir de `2026-05`, la migración parcial de SMS hacia **WhatsApp** redujo sustancialmente el gasto mensual manteniendo la tasa de entrega.

### 5. Sobre-agenda y Sala de Espera
Evalúa el impacto de sobre-agendar la agenda y validar la congestión física (Regla **RN-05**, colapso definido como `> 5 pacientes esperando`):
* **Indicadores Globales:** **16,467 sobrecupos usados** y **550 bloques con sala colapsada**.
* **Riesgo de Colapso:** El porcentaje de colapso se duplica cuando hay sobrecupo (**25%** con sobrecupo vs. **12%** sin sobrecupo).
* **Concentración:** **Laboratorio Clínico (6.2 min)** y **Medicina General (5.6 min)** concentran la mayor cantidad de sobrecupos; bajo la regla **RN-06 (POST)**, las especialidades no sobre-agendables quedan restringidas en `0`.

### 6. Clima y Anticipación
Explora factores externos y comportamentales de agendamiento (incluyendo privacidad diferencial **RN-09** que oculta celdas con `< 5 pacientes`):
* **Efecto Lluvia:** La inasistencia sube progresivamente desde días secos (`0 mm`: **20.1%**) hasta días de **lluvia fuerte (`> 20 mm`: 27.2%)**.
* **Días de Anticipación:** Existe una correlación directa entre el tiempo de espera y el olvido/cancelación: citas agendadas con **0-2 días** tienen **13.4%** de inasistencia, escalando hasta **40.7%** cuando se agendan con **más de 14 días**.
* **Condiciones Crónicas:** Cruza patologías (*Diabetes, EPOC/Asma, Hipertensión*) por grupo de edad, destacando un **30.2%** de ausentismo en pacientes de 18-29 años con EPOC/Asma.

### 7. Calidad de Datos
Audita la integridad de la **Capa Silver** del pipeline de datos antes de su consumo analítico:
* **Fuentes Auditadas:** Monitorea defectos crónicos provenientes de **F1 Agendamiento**, **F2 Admisiones** y **F4 Mensajería**.
* **Reglas de Remediación:**
  * *Archivo recibido por sede (F1 a F4):* Reproceso automático bajo **RM-01 (ventana de 3 días)**.
  * *Admisión de cita inexistente / fecha cita:* Enviados a **Cuarentena**.
  * *Paciente duplicado:* **Unificado (MDM)**.
  * *Codificación Latin-1 / separador `;`:* **Corregido** e ingesta.
  * *Estado que retrocede (`Leído -> Enviado`):* **Descartado por máquina de estados**.

---

## 🚀 Instrucciones de Uso Rápido

1. **Filtros Globales:** En la esquina superior derecha de todas las páginas encontrarás los segmentadores de **Mes (`anio_mes`)** y **Sede** para acotar cualquier análisis.
2. **Navegación Cruzada:** Utiliza los botones superiores debajo del encabezado azul para saltar entre módulos sin perder el contexto de tus filtros.
3. **Jerarquías en Matrices:** En la pestaña *Ocupación Efectiva*, haz clic en el ícono `+` junto al nombre de cada sede para desplegar el detalle individual por médico o especialista.