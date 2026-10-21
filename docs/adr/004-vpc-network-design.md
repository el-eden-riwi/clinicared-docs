---
title: ADR 004 - Diseño de Red (VPC) y Costo Cero
sidebar_position: 4
---

# ADR 004: Diseño de Red (VPC), Aislamiento y Estrategia de Costo Cero

## Estado
Aceptado

## Contexto
El sistema ClínicaRed procesa información de salud identificable (PHI). El requerimiento estricto es aislar los componentes que manejan estos datos en segmentos de red protegidos, sin exposición directa a Internet. A su vez, el proyecto exige encontrar la solución de **costo óptimo** (buscando aprovechar al máximo la capa gratuita - Free Tier de AWS).

Las subredes privadas necesitan salida a Internet para descargar imágenes de contenedores (ECR) y comunicarse con el proveedor de SMS externo, lo que obliga a usar un mecanismo de traducción de red (NAT).

## Alternativas Evaluadas (Control de Costos)

*   **Opción A: AWS Managed NAT Gateway.** Es la solución recomendada por AWS para producción. Proporciona alta disponibilidad y escalabilidad automática. 
    *   *Costo estimado:* ~$32.00 USD mensuales por AZ (solo por aprovisionamiento) + costo por GB procesado.
*   **Opción B: NAT Instance (EC2).** Desplegar una instancia EC2 con una AMI especial configurada para enrutar tráfico (NAT) ubicada en la subred pública.
    *   *Costo estimado:* $0.00 USD. Al usar una instancia `t2.micro` o `t3.micro`, esta entra en las 750 horas mensuales de la Capa Gratuita (Free Tier) de AWS.

## Decisión
Se elige la **Opción B (NAT Instance en EC2)**. 

Se implementará una arquitectura de red dentro de una única Virtual Private Cloud (VPC) con la siguiente topología para garantizar aislamiento estricto sin generar costos de aprovisionamiento de red:

1.  **Capa Pública (Public Subnets):** Contiene el Application Load Balancer (ALB) y la instancia EC2 `t2.micro` configurada como NAT Instance. Tienen acceso mediante un Internet Gateway (IGW).
2.  **Capa Privada de Aplicación (Private App Subnets):** Sin IPs públicas. Contiene los contenedores de la API (Fargate) y Airflow. Su tráfico de salida hacia Internet se enruta hacia la NAT Instance.
3.  **Capa Privada de Datos (Private Data Subnets):** Estrictamente aisladas. Contiene la base de datos relacional (Amazon RDS PostgreSQL). No tienen ruta de salida a Internet bajo ninguna circunstancia.

### Estrategia de Security Groups (SGs) (Mínimo Privilegio)
1.  `ALB-SG`: Permite tráfico HTTP (80) entrante desde Internet.
2.  `NAT-Instance-SG`: Permite tráfico HTTP/HTTPS (80/443) proveniente únicamente de las subredes privadas.
3.  `App-SG`: Permite tráfico en el puerto 8000 exclusivamente desde el `ALB-SG`.
4.  `DB-SG`: Permite tráfico en el puerto 5432 exclusivamente desde el `App-SG`.

## Consecuencias
*   **Positivas:** Cumple con la normativa de protección de datos (PHI aislados) y reduce el costo de la infraestructura de red de ~$64/mes a **$0.00**, cumpliendo los criterios de la US 03 y el análisis de AWS Pricing Calculator.
*   **Negativas:** A diferencia del NAT Gateway administrado, la NAT Instance puede ser un cuello de botella si el tráfico es masivo, y requiere que el equipo gestione la instancia EC2 (parches, reinicios). Este *trade-off* es aceptable para la escala actual del proyecto y la prioridad de reducción de costos.