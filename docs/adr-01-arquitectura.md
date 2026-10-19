---
sidebar_position: 1
title: ADR 01 - Arquitectura
---

# ADR 01: Arquitectura de Software para ClínicaRed

## 1. Contexto
ClínicaRed requiere un backend robusto, rápido y escalable para gestionar información médica, pacientes y citas, asegurando un mantenimiento sencillo a medida que el equipo crece.

## 2. Decisión
Se ha decidido utilizar **FastAPI (Python)** implementando una **Arquitectura en Capas** estricta. La separación de responsabilidades será la siguiente:

* **Routers (`routers/`):** Puntos de entrada de la API. Validan los datos de entrada usando esquemas Pydantic y delegan el trabajo.
* **Controllers/Services (`services/`):** Contienen toda la lógica de negocio y las reglas de la clínica.
* **Repositories (`repositories/`):** Única capa autorizada para ejecutar consultas a la base de datos utilizando SQLAlchemy.
* **Models (`models/`):** Representación de las tablas de PostgreSQL.

## 3. Consecuencias
* **Positivas:** El código es altamente testeable. Si en el futuro cambiamos la base de datos, solo modificaremos la capa de repositorios sin tocar la lógica de negocio.
* **Negativas:** Requiere crear más archivos y escribir un poco más de código inicial (boilerplate) en comparación con poner todo en un solo archivo.