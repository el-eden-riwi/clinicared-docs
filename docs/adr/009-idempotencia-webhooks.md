---
id: adr-009-idempotencia-webhooks
title: ADR 009 - Patrón de Idempotencia en Webhooks y Mensajería
sidebar_label: 009 - Idempotencia Webhooks
tags: [adr, backend, resilience, rabbitmq]
---

# ADR 009: Patrón de Idempotencia en la Recepción de Webhooks

## Contexto
Las redes y los proveedores de mensajería (SMS/Email) son inestables. El orquestador puede enviar eventos duplicados o desordenados al reintentar tareas fallidas en RabbitMQ, lo que causaría spam al paciente o corrupción transaccional en la clínica (por ejemplo, registrar una admisión dos veces).

## Decisión
Validar claves únicas de idempotencia (`idempotency_key`) en los endpoints del backend que procesan notificaciones, admisiones y cálculos de riesgo.

## Consecuencias
- **Positivas:** Se blinda el sistema contra el *overbooking* accidental y la duplicidad de mensajes.
- **Negativas:** Añade un paso de validación extra en PostgreSQL antes de confirmar la transacción, aumentando ligeramente la latencia de escritura en la API.