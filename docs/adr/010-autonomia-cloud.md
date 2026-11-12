---
id: adr-010-autonomia-cloud
title: "ADR 010: Hoja de Ruta hacia Autonomía Total en la Nube (Orquestación 24/7)"
sidebar_label: "ADR 010: Autonomía Cloud (Fase 2)"
---

# ADR 010: Hoja de Ruta hacia Autonomía Total en la Nube (Orquestación 24/7)

- **Estado:** Propuesto (Planificado para Lanzamiento Futuro — Fase 2)
- **Fecha:** 2026-11-12
- **Relación:** Extiende el **ADR 005** (Infraestructura Serverless AWS Fargate + ALB + RDS)

## Contexto

En la Fase 1 (**ADR 005**), ClínicaRed consolidó una arquitectura híbrida optimizada en costos con persistencia real en la nube:

1. **Capa Transaccional y Persistencia en AWS (`us-east-2`):** Backend FastAPI desplegado en **AWS ECS Fargate** detrás de un **Application Load Balancer (ALB)** conectado a **PostgreSQL en Amazon RDS (`db.t3.micro`)**, gestionando pacientes, citas, asistencias e idempotencia en tiempo real.
2. **Capa de Orquestación, Analítica y Presentación bajo demanda:** Apache Airflow, PySpark, RabbitMQ y el cliente React/Vite operan en contenedores Docker locales integrados mediante API REST (`POST /dagRuns` con autenticación básica y CORS), permitiendo ejecutar el ETL analítico sobre datos reales de RDS sin incurrir en costos continuos de cómputo 24/7.

Aunque este diseño elimina los datos simulados y mantiene el gasto adicional en **$0.00 USD/mes** durante validación, los DAGs programados (`@hourly`, `@daily`, `*/30`) y el broker RabbitMQ dependen de que la estación local permanezca encendida.

## Decisión

Para un **lanzamiento futuro a producción comercial (Fase 2)**, se define la migración de los componentes locales hacia servicios gestionados y cómputo dedicado en AWS para alcanzar **autonomía operativa 24/7**:

1. **Frontend Público en CDN:** Desplegar `clinicared-frontend` en **Vercel** o **GitHub Pages** con compilación estática automatizada vía CI/CD.
2. **Terminación TLS/HTTPS con AWS CloudFront:** Incorporar una distribución **Amazon CloudFront** delante del Application Load Balancer (`clinicared-alb`) para habilitar cifrado `HTTPS` extremo a extremo y evitar bloqueos de contenido mixto (*Mixed Content*) desde navegadores públicos.
3. **Orquestación y Mensajería en Amazon EC2:** Provisionar una instancia **Amazon EC2 Ubuntu (`t3.medium` — 2 vCPU, 4 GB RAM, 30 GB EBS)** dentro de la misma VPC de AWS para alojar el stack de `clinicared-orquestacion` (Apache Airflow, PySpark y RabbitMQ) con política de reinicio automático (`restart: always`).
4. **Conectividad Privada Fargate ↔ RabbitMQ:** Actualizar la variable de entorno `RABBITMQ_HOST` en la definición de tarea de ECS Fargate apuntando a la IP privada de la instancia EC2 dentro del mismo *Security Group*, habilitando el encolamiento asíncrono continuo sin intervención manual.

## Impacto Financiero y Trade-offs (Comparativa vs. ADR 005)

| Componente | Fase 1 Actual (ADR 005) | Fase 2 Autónoma 24/7 (ADR 010) |
| :--- | :--- | :--- |
| **Backend + ALB + RDS (`us-east-2`)** | ~$50.12 USD/mes (amortizado con créditos/apagado bajo demanda) | ~$50.12 USD/mes |
| **Frontend + HTTPS (CloudFront)** | Local (`localhost:5173`) — $0.00 USD | Vercel / GitHub Pages + CloudFront Free Tier — **$0.00 USD** |
| **Orquestación (Airflow + Spark + RabbitMQ)** | Docker local bajo demanda — $0.00 USD | EC2 `t3.medium` + 30 GB EBS (730 h/mes) — **~$32.80 USD/mes** |
| **Disponibilidad de DAGs y Colas** | Bajo demanda (requiere estación local encendida) | **Autónoma 24/7 en la nube** |

## Criterios de Activación

Esta migración se ejecutará cuando ClínicaRed pase de fase de validación a operación clínica continua con usuarios externos concurrentes, momento en el cual se aprobará el presupuesto mensual adicional para el cómputo permanente de la instancia de orquestación.