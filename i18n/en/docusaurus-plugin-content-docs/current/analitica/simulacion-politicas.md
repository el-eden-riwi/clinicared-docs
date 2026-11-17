---
id: simulacion-politicas-recordatorio
title: Historical Simulation of Reminder Policies
sidebar_label: Policy Simulation (US 06)
---

# Historical Simulation: Reminder Policies (US 06 - Task 3)

## 1. Context and Objective

Missed medical appointments (*no-shows*) generate operational losses and idle capacity in clinics. Standard practice sends SMS reminders indiscriminately to all scheduled patients, causing messaging cost overruns and notification fatigue among patients who consistently attend.

This simulation contrasts the financial and operational impact of two strategies evaluated across **100 historical appointments** and **50 patients** persisted in PostgreSQL.

---

## 2. Policy Definitions

- **Policy A (Traditional / Mass Blast):** Indiscriminate SMS dispatch to 100% of scheduled appointments, assuming a fixed cost of **$0.05 USD** per outbound message.
- **Policy B (Analytical / Risk-Based Segmentation):** Targeted dispatch exclusively to patients classified as **MEDIUM** or **HIGH** risk by the analytical business rules engine (`src/services/risk_calculator.py`), omitting messages for reliable patients (**LOW**).

---

## 3. Quantitative Results

| Comparative Metric | Policy A (Traditional) | Policy B (ClínicaRed Analytical) | Difference / Impact |
| :--- | :---: | :---: | :---: |
| **Notification Criterion** | All scheduled patients (100%) | Analytical risk segmentation | Surgical optimization |
| **SMS Volume Sent** | 100 messages | 46 messages | -54 dispatches avoided |
| **Total Messaging Cost** | $5.00 USD | $2.30 USD | **$2.70 USD net savings** |
| **Cost Optimization Percentage** | 0.0% (Baseline) | **54.0%** | **54% OPEX reduction** |
| **Unnecessary Messages Avoided (Spam)** | 0 | 54 reliable patients | Reduced channel fatigue |
| **Critical Patient Coverage** | 100% | 100% (46/46) | Zero loss in coverage |

---

## 4. Risk Distribution in the Dataset

- **Low Risk (LOW):** 54 appointments (54.0%) — Patients with regular attendance history; require no additional intervention.
- **Medium Risk (MEDIUM):** 46 appointments (46.0%) — Patients with prior no-shows or extended inactivity windows; require preventive alerts.
- **High Risk (HIGH):** 0 appointments (0.0%) in this test window.

---

## 5. Technical Conclusion and ROI

The **ClínicaRed** analytical engine demonstrated that predictive segmentation achieves a **54% reduction in operational messaging costs** while keeping coverage intact for no-show-prone patients. This strategy enables reallocating resources toward intensive multi-channel reminders for high-risk patients without increasing the overall budget.

---

## 6. Reproducibility

The benchmarking script can be executed directly against either the local PostgreSQL database or the AWS RDS instance using:

```bash
python simulacion_politicas.py
```
