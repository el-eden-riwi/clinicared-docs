---
sidebar_position: 6
title: "006: Evaluación de Impacto en la Privacidad (PIA)"
---

# ADR 006 / PIA: Evaluación de Impacto en la Privacidad y Manejo de Datos Sensibles

## 1. Contexto y Objetivo
Como parte de la **Task 6** del proyecto ClínicaRed, se realiza esta Evaluación de Impacto en la Privacidad (Privacy Impact Assessment - PIA). El propósito es identificar, documentar y mitigar los riesgos asociados al flujo, almacenamiento y procesamiento de datos sensibles de los pacientes (historias clínicas, credenciales e información de identificación personal) dentro de la arquitectura en la nube basada en AWS.

---

## 2. Flujo de Datos Sensibles (Data Flows)
El sistema maneja información de salud protegida (PHI/PII), la cual sigue un flujo controlado y seguro a través de los componentes de la infraestructura:

1. **Captura y Tránsito (Cliente hacia Backend):**
   - Los usuarios (médicos, pacientes, administradores) interactúan con la interfaz y envían peticiones HTTP cifradas mediante **HTTPS (TLS 1.2/1.3)**.
   - El tráfico ingresa a través del **Application Load Balancer (ALB)**, el cual termina el certificado SSL/TLS de forma segura.
2. **Procesamiento (Capa de Aplicación en AWS ECS Fargate):**
   - Los contenedores ejecutándose en Fargate procesan las peticiones en una red privada (VPC Subnets privadas).
   - Ninguna información sensible se almacena de forma persistente dentro de los contenedores (arquitectura sin estado o *stateless*).
3. **Almacenamiento Persistente (Base de Datos Amazon RDS PostgreSQL):**
   - Los datos relacionales y las historias clínicas se guardan en volúmenes cifrados dentro de **Amazon RDS**.
   - Las credenciales de acceso a la base de datos no están hardcodeadas en el código fuente, sino gestionadas mediante variables de entorno seguras inyectadas en tiempo de ejecución.

---

## 3. Matriz de Datos Sensibles Identificados

| Elemento de Dato | Clasificación | Nivel de Riesgo | Medida de Mitigación Implementada |
| :--- | :--- | :--- | :--- |
| **Credenciales de Usuario** (Contraseñas) | Confidencial / Autenticación | Alto | Hash seguro mediante algoritmos de encriptación robustos (como bcrypt) antes de almacenarse. |
| **Datos de Identificación del Paciente** (Nombres, Cédula) | PII (Información Personal Identificable) | Alto | Tránsito cifrado por HTTPS y acceso restringido estrictamente a roles autorizados mediante la API. |
| **Registros Médicos e Historias Clínicas** | PHI (Información de Salud Protegida) | Crítico | Aislamiento en subredes privadas de RDS sin exposición directa a internet público. |

---

## 4. Análisis de Riesgos Residuales
A pesar de las medidas de seguridad perimetrales y de red implementadas (como VPCs y Security Groups), se identifican y aceptan los siguientes riesgos residuales con sus respectivas estrategias de contención:

1. **Riesgo de brecha por acceso de terceros o credenciales filtradas:**
   - *Mitigación:* Las llaves de acceso a AWS (AWS CLI/IAM) se mantienen estrictamente fuera del repositorio de código fuente (`~/.aws/`) y se aplican políticas de mínimo privilegio.
2. **Riesgo de exposición en la base de datos:**
   - *Mitigación:* Amazon RDS está configurado en una subred privada, lo que impide el acceso directo desde el exterior. Solo los contenedores backend en Fargate autorizados por Security Groups pueden comunicarse con el puerto de la base de datos.
3. **Riesgo de pérdida de logs de auditoría:**
   - *Mitigación:* Centralización de los registros de actividad del sistema para permitir la trazabilidad de quién accedió a qué información y en qué momento.

---

## 5. Conclusión
La arquitectura seleccionada en el proyecto ClínicaRed (ECS Fargate + RDS + ALB) proporciona un aislamiento adecuado y las herramientas de seguridad necesarias para garantizar la privacidad y el cumplimiento normativo en el manejo de datos médicos sensibles.