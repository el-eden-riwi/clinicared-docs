---
sidebar_position: 5
title: "005: Elección de Infraestructura AWS"
---

# ADR 005: Elección de Infraestructura AWS (Fargate vs EC2)

## Contexto
Como parte de la Task 5 del proyecto ClínicaRed, se requirió diseñar y cotizar la infraestructura de despliegue en la nube de AWS para el backend (Docker) y la base de datos PostgreSQL, evaluando dos opciones principales para encontrar el balance ideal entre costo, rendimiento y tiempo de administración.

- **Opción A (Arquitectura Serverless):** Amazon ECS con AWS Fargate, Application Load Balancer (ALB) y Amazon RDS (db.t3.micro). Costo estimado: ~50.12 USD/mes.
- **Opción B (Arquitectura Tradicional):** Instancia Amazon EC2 (t3.small) ejecutando contenedores manualmente y Amazon RDS (db.t3.micro). Costo estimado: ~33.02 USD/mes.

## Decisión
Se decidió implementar la **Opción A (ECS Fargate + ALB + RDS)**.

## Justificación
Aunque la Opción B presenta un costo mensual ligeramente inferior, la Opción A aporta beneficios técnicos y operativos que justifican la diferencia:

1. **Cero administración de servidores (Serverless):** Con AWS Fargate no es necesario parchear, actualizar ni administrar el sistema operativo subyacente, lo que permite al equipo de desarrollo enfocarse 100% en el código y en la lógica de negocio.
2. **Alta disponibilidad y escalabilidad:** La inclusión del Application Load Balancer (ALB) permite distribuir el tráfico de manera eficiente y escalar los contenedores automáticamente según la demanda, una configuración que tomaría mucho tiempo replicar y mantener manualmente en una instancia EC2 pura.
3. **Capa gratuita (Free Tier):** Gran parte de los costos asociados a esta arquitectura están actualmente amortizados por los créditos de la capa gratuita de AWS, haciendo que el impacto financiero real sea mínimo durante la fase de pruebas y despliegue inicial.

## Anexos
Para revisar el desglose detallado de los costos calculados para ambas opciones, puedes consultar el documento oficial generado por la Calculadora de Precios de AWS:

📄 [Descargar PDF de Estimación de Costos AWS](/estimacion-costos-aws.pdf)