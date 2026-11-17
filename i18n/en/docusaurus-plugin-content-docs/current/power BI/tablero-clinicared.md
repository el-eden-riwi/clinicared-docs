---
sidebar_position: 5
title: ClínicaRed Analytical Dashboard
description: Functional documentation, key metrics, and downloadable compressed package (.zip) of the ClínicaRed Power BI analytical model.
---

# Analytical Dashboard: ClínicaRed Appointment Management

This document details the functional architecture, Key Performance Indicators (KPIs), and primary findings of the **Power BI** dashboard designed to analyze scheduling operations, no-shows, occupancy, and data quality across **ClínicaRed** (based on an audited volume of **421,772 loaded appointments**).

---

## 📥 Download Power BI Package (`.zip`)

To explore dynamic slicers by **Month (`anio_mes`)** and **Site**, inspect the data model, or review DAX measures, download the compressed archive containing the full project:

:::tip Source File Available

[**⬇️ Download ClinicaRed_PowerBI_v2.zip (15.2 MB)**](/files/ClinicaRed_PowerBI_v2.zip)

:::

*Instructions: Extract the `.zip` archive on your computer and open the `.pbix` file inside using **Microsoft Power BI Desktop**.*

---

## 📊 Dashboard Structure and Pages

The report is organized into **7 interactive views** accessible from the top navigation menu, allowing stakeholders to evaluate the impact of operational policies implemented starting May 2026 (**2026-05**).

### 1. Executive Summary
Consolidates overall operational status against strategic organizational targets:
- **No-Show Rate:** **20.82%** (Target: `≤ 16%`). While still above target, it shows a notable decline following the `2026-05` policy, highlighted by a drop among **high-risk** patients from **48.3% (PRE)** to **24.9% (POST)**.
- **Reminder Cost:** **$8.26M COP** (Target: `≤ $10M`). Target achieved through channel optimization.
- **Specialist Occupancy:** **69.39%** (Target: `≥ 80%`).
- **Waitlist (`< 10 min`):** **52.6%**
- **ET-58 Control:** Positive validation (`Passes control query`) across all **421,772 records**.

### 2. No-Shows
Answers *where and when patients miss appointments*, segmented by location, specialty, and demographic profile:
- **By Site:** Highest rates occur at **Sede Norte Barranquilla (25.1%)**, **Sede Bello (22.0%)**, and **Sede Chapinero Bogotá (22.1%)**.
- **By Specialty:** Led by **Psychiatry (24.0%)**, **Dermatology (24.7%)**, and **Psychology (22.8%)**, compared to General Medicine (21.6%).
- **Heatmap (Day x Time Slot):** Peak absenteeism occurs on **Mondays from 07:00 to 08:00 (27.9%)** and **Saturdays in the first morning slot (25.7%)**.
- **Age Group:** Young adults aged **18 to 29** exhibit the highest no-show rate (**25.0%**), whereas the **60 to 74** age group is the most compliant (**17.7%**).

### 3. Effective Occupancy
Evaluates the ratio of attended appointments to offered slots (Business Rule **RN-02**):
- **Performance by Category (PRE vs. POST):** All categories improved post-policy: **Diagnostic Imaging (74.5%)**, **General Medicine (70.1%)**, **Specialists (68.5%)**, and **Laboratory (65.7%)**.
- **Operational Breakdown:** Allows drilling down into each clinic site (e.g., *Chapinero Bogotá*, *Centro Barranquilla*, *Bello*) to audit offered slots vs. attended visits per physician.

### 4. Reminders and Costs
Analyzes return on investment and effectiveness of multi-channel messaging (SMS and WhatsApp):
- **Volume and Efficiency:** **376,914 messages** sent at a total cost of **$8,260,940 COP**.
- **Avoided Impact:** Estimated **14,682 prevented no-shows**, at a unit cost of **$481.2 COP per rescued appointment**.
- **Effectiveness by Risk:** Among **high-risk** patients, no-shows drop from **72.3% (without reminder)** to **33.6% (with reminder)**.
- **Channel Savings:** Starting `2026-05`, partial migration from SMS to **WhatsApp** substantially reduced monthly spend while preserving delivery rates.

### 5. Overbooking and Waiting Room
Evaluates the impact of schedule overbooking and validates physical congestion (Rule **RN-05**, collapse defined as `> 5 waiting patients`):
- **Global Indicators:** **16,467 overbooked slots used** and **550 collapsed waiting-room blocks**.
- **Collapse Risk:** Waiting-room collapse rate doubles when overbooking is applied (**25%** with overbooking vs. **12%** without overbooking).
- **Concentration:** **Clinical Laboratory (6.2 min)** and **General Medicine (5.6 min)** account for the highest overbooking volume; under rule **RN-06 (POST)**, non-overbookable specialties remain strictly capped at `0`.

### 6. Weather and Lead Time
Explores external and behavioral scheduling factors (including differential privacy **RN-09**, masking cells with `< 5 patients`):
- **Rain Effect:** No-shows rise progressively from dry days (`0 mm`: **20.1%**) to **heavy rain days (`> 20 mm`: 27.2%)**.
- **Lead Time (Days in Advance):** Direct correlation between wait time and forgetfulness/cancellation: appointments booked **0–2 days** ahead show **13.4%** no-shows, climbing to **40.7%** when scheduled **more than 14 days** in advance.
- **Chronic Conditions:** Cross-analyzes conditions (*Diabetes, COPD/Asthma, Hypertension*) by age group, highlighting a **30.2%** no-show rate among 18–29-year-old patients with COPD/Asthma.

### 7. Data Quality
Audits the integrity of the pipeline's **Silver Layer** prior to analytical consumption:
- **Audited Sources:** Tracks chronic defects originating from **F1 Scheduling**, **F2 Admissions**, and **F4 Messaging**.
- **Remediation Rules:**
  * *File received per site (F1 to F4):* Automatic reprocessing under **RM-01 (3-day window)**.
  * *Admission for non-existent appointment / invalid date:* Routed to **Quarantine**.
  * *Duplicate patient:* **Merged (MDM)**.
  * *Latin-1 encoding / `;` delimiter:* **Corrected** and ingested.
  * *Regressing status (`Read -> Sent`):* **Discarded by state machine**.

---

## 🚀 Quick Usage Instructions

1. **Global Filters:** In the upper-right corner of every page, use the **Month (`anio_mes`)** and **Site** slicers to scope any analysis.
2. **Cross-Page Navigation:** Use the top buttons beneath the blue header to switch between modules without losing active filter context.
3. **Matrix Hierarchies:** On the *Effective Occupancy* tab, click the `+` icon next to each site name to expand individual physician or specialist details.
