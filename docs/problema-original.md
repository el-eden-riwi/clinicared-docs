---
title: El Problema Original
sidebar_position: 1
---

# Caso de Estudio: ClínicaRed Citas
**Reducción de inasistencias y optimización de agendas en una red de clínicas ambulatorias**

> **Nota para el equipo:** Este documento describe un problema de negocio, sus reglas, sus fuentes de datos y cómo se aceptará el trabajo. Deliberadamente no indica cómo resolverlo. Cualquier decisión técnica (qué servicio, cuántos recursos, qué patrón, qué topología) es responsabilidad del equipo y debe justificarse por escrito.

## 📋 Ficha del Proyecto

| Atributo | Detalle |
| :--- | :--- |
| **Organización (ficticia)** | ClínicaRed IPS - red de 22 sedes ambulatorias y 640 profesionales de la salud |
| **Sector** | Salud |
| **Duración** | 6 semanas |
| **Equipo sugerido** | 3 a 4 integrantes |
| **Costos AWS** | No hay presupuesto predefinido: el equipo debe encontrar y justificar la solución de costo óptimo. |
| **Alcance esperado** | Solución completa end-to-end: desde la generación e ingesta de datos hasta el tablero, desplegada en AWS. |
| **Tipo de documento** | Enunciado de problema. No incluye solución: el equipo define arquitectura, infraestructura, recursos y costos. |

---

## 1. Contexto de Negocio
ClínicaRed atiende a más de **400.000 pacientes** afiliados a distintas aseguradoras en **22 sedes**. Cada día se agendan cerca de **9.000 citas** de medicina general, especialistas, laboratorio e imágenes diagnósticas.

La tasa de inasistencia (*no-show*) es del **21%**. Cada cita perdida es capacidad médica pagada que no se factura, y los pacientes que sí necesitan atención esperan en promedio **18 días** por un especialista.

La dirección médica y la financiera aprobaron un proyecto para construir una plataforma que consolide agendas, historial de asistencia y comunicaciones, clasifique el riesgo de inasistencia con reglas explícitas y permita aplicar políticas de sobre-agenda controlada y recordatorios.

---

## 2. Problema a Resolver
La información de citas está en el sistema de agendamiento de cada sede; la asistencia real se registra en otro sistema de admisiones y los recordatorios por SMS se envían desde un proveedor externo que no devuelve información estructurada. Nadie sabe qué pacientes tienen más probabilidad de faltar ni qué sedes están sub o sobre-utilizadas.

Se requiere integrar estas fuentes con estricto cuidado de datos sensibles de salud, aplicar reglas clínicas y administrativas de agenda, orquestar recordatorios y producir indicadores de productividad por sede y especialidad.

### 2.1 Dolores Actuales
* **21% de inasistencias**; en algunas especialidades supera el 30%.
* **Recordatorios enviados a todos por igual**, con costo alto y bajo efecto.
* **Sobre-agenda manual** que a veces genera salas de espera colapsadas.
* **Datos sensibles** copiados en hojas de cálculo sin control de acceso.
* **Indicadores de productividad** calculados de forma distinta en cada sede.

---

## 3. Objetivos del Negocio
1. **Reducir la inasistencia global** a menos de 15% en seis meses.
2. **Disminuir en 30% el costo de recordatorios** enfocándolos por riesgo.
3. **Aumentar la ocupación efectiva** de agendas de especialistas al 90%.
4. **Cumplir la normativa** de protección de datos de salud en toda la cadena.

---

## 4. Actores y Usuarios

| Actor | Qué necesita del sistema |
| :--- | :--- |
| **Director médico** | Ocupación efectiva, inasistencias y tiempos de espera por sede y especialidad. |
| **Coordinador de agenda** | Lista diaria de citas con riesgo y cupos de sobre-agenda permitidos. |
| **Paciente** | Confirmar o cancelar su cita mediante un enlace o respuesta de mensaje. |
| **Proveedor de mensajería** | Recibir órdenes de envío y devolver estados de entrega. |
| **Oficial de protección de datos** | Auditar quién accedió a qué información y cuándo. |

---

## 5. Fuentes de Datos
El sistema debe integrar todas las fuentes siguientes. Las marcadas como simuladas deben ser construidas por el equipo siguiendo las especificaciones de la sección 5.2; su diseño interno es decisión del equipo.

| ID | Fuente | Tipo | Acceso / Formato | Frecuencia | Volumen |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F1** | Medical Appointment No Shows | CSV Kaggle | `kaggle.com/datasets/joniarroba/noshowappointments` | Histórico único | ~110 mil citas |
| **F2** | Sistema de agendamiento | BD simulada | PostgreSQL: pacientes, profesionales, sedes, especialidades, citas. Poblada mediante seed. | Continua | ≥ 1 M citas en 12 meses |
| **F3** | Admisiones (asistencia real) | Archivo simulado | CSV diario por sede depositado en almacenamiento de objetos | Diaria (02:00) | 22 archivos/día |
| **F4** | Proveedor de SMS / WhatsApp | API simulada | REST para enviar mensajes + webhook de estados (enviado, entregado, leído, fallido, respondido) | Continuo | ≥ 12 mil mensajes/día |
| **F5** | Festivos nacionales | API pública | Nager.Date (`date.nager.at`) | Anual | ~20 registros/año |
| **F6** | Clima diario por ciudad de sede | API pública | Open-Meteo | Diaria | 22 sedes |
| **F7** | Catálogo de especialidades y tiempos | Archivo plano | CSV mantenido por la dirección médica | Mensual | < 200 filas |

### 5.1 Detalle de Fuentes Externas
* **F1** aporta el histórico de comportamiento de asistencia (edad, género, becas, condiciones crónicas, SMS recibido, días de anticipación). El equipo debe mapearlo al modelo de ClínicaRed.
* **F1** contiene edades negativas y valores atípicos; su tratamiento debe documentarse.
* **F6** se usa para analizar si el clima influye en la inasistencia.

### 5.2 Especificación de Fuentes Simuladas
> **⚠️ Obligatorio: Seed de datos**
> Todos los datos de las bases de datos simuladas deben generarse mediante un seed (scripts de siembra) versionado en el repositorio. No se aceptan datos cargados a mano ni volcados (dumps) sin su seed.

El seed debe:
1. Usar una semilla fija para que los datos sean reproducibles.
2. Ser idempotente (ejecutarlo varias veces no duplica datos).
3. Permitir parametrizar el volumen (modo desarrollo pequeño y modo completo).
4. Respetar la integridad referencial y un catálogo coherente con las APIs y eventos simulados.
5. Inyectar los defectos de calidad de la sección 5.3 con una tasa configurable.
6. Ejecutarse tanto en local como contra la base de datos en AWS.

* **F2:** Generador de citas con distribución realista por especialidad y franja; incluye reprogramaciones y cancelaciones con anticipación variable.
* **F3:** Archivos por sede con formatos ligeramente distintos (separador, codificación de caracteres, nombres de columnas) y archivos que llegan tarde o no llegan.
* **F4:** API que simule latencias variables, errores 5xx y webhooks duplicados o fuera de orden; debe permitir simular respuestas de pacientes (`CONFIRMO` / `CANCELO`).
* Todos los datos de pacientes deben ser sintéticos.

### 5.3 Problemas de Calidad de Datos Conocidos
Los datos llegarán con los siguientes defectos (las fuentes simuladas deben inyectarlos deliberadamente con una tasa configurable):
* Pacientes duplicados con variaciones en el nombre o el documento.
* Citas con fecha de agendamiento posterior a la fecha de la cita.
* Archivos de admisiones con registros de citas inexistentes.
* Webhooks de estado repetidos o con estados que retroceden (leído -> enviado).
* Codificaciones de caracteres mezcladas (UTF-8 / Latin-1).

---

## 6. Reglas de Negocio
Las reglas son obligatorias. Cada regla debe estar trazada a código y a al menos una prueba automatizada.

| ID | Regla de Negocio |
| :--- | :--- |
| **RN-01** | Una cita es "inasistencia" si no existe registro de admisión hasta 20 minutos después de la hora programada y no fue cancelada con al menos 4 horas de anticipación. |
| **RN-02** | Clasificación de riesgo por reglas (no por modelo de ML): **Alto** si el paciente tiene al menos 2 inasistencias en 6 meses o la cita se agendó con más de 20 días de anticipación y el paciente no ha confirmado; **Medio** si tiene 1 inasistencia en 6 meses o anticipación mayor a 10 días; **Bajo** en otro caso. |
| **RN-03** | Recordatorios: riesgo **Alto** recibe mensajes a las 72 h y 24 h; **Medio** a las 24 h; **Bajo** no recibe mensaje salvo que sea su primera cita. |
| **RN-04** | No se envían mensajes entre 20:00 y 07:00 hora local ni en festivos; se reprograman al siguiente horario válido. |
| **RN-05** | Sobre-agenda: se permite agregar 1 cupo extra por cada 3 citas de riesgo Alto en la misma franja de un profesional, con máximo 2 cupos extra por franja. Nunca en especialidades marcadas como "no sobre-agendable" (F7). |
| **RN-06** | Si un paciente responde `CANCELO`, la cita se libera y el cupo se ofrece a la lista de espera en menos de 10 minutos. |
| **RN-07** | Un paciente con 3 inasistencias en 6 meses pasa a "agendamiento restringido": solo puede agendar con confirmación previa obligatoria. |
| **RN-08** | Ocupación efectiva = citas atendidas / cupos ofertados, por profesional, sede y especialidad. |
| **RN-09** | Los datos clínicos (condiciones crónicas) solo pueden estar en la capa analítica agregados; nunca a nivel de paciente identificable. |
| **RN-10** | Todo acceso a información de un paciente vía API debe quedar en un registro de auditoría inmutable. |
| **RN-11** | Las citas de menores de edad se notifican al acudiente registrado, nunca al menor. |

---

## 7. Requerimientos Funcionales

| ID | Requerimiento | Prioridad |
| :--- | :--- | :--- |
| **RF-01** | Integrar histórico (F1) y operación continua (F2-F4) en un repositorio único de citas y asistencia. | Alta |
| **RF-02** | Calcular diariamente el riesgo de cada cita de los próximos 7 días. | Alta |
| **RF-03** | Orquestar el envío de recordatorios según riesgo y horarios permitidos. | Alta |
| **RF-04** | Recibir y procesar los webhooks del proveedor de mensajería. | Alta |
| **RF-05** | Exponer API para coordinadores: citas con riesgo y cupos de sobre-agenda permitidos por franja. | Alta |
| **RF-06** | Liberar cupos cancelados y ofrecerlos a la lista de espera. | Media |
| **RF-07** | Consolidar los archivos de admisiones aunque lleguen con formatos distintos o tarde. | Alta |
| **RF-08** | Registrar auditoría de accesos a información de pacientes. | Alta |
| **RF-09** | Modelo analítico de citas, asistencia, profesionales y sedes. | Alta |

---

## 8. Requerimientos No Funcionales

| ID | Atributo | Requerimiento Medible |
| :--- | :--- | :--- |
| **RNF-01** | Privacidad | Datos identificables cifrados en reposo y en tránsito; seudonimización en la capa analítica. |
| **RNF-02** | Latencia | API de coordinadores p95 menor o igual a 400 ms. |
| **RNF-03** | Confiabilidad | Ningún recordatorio duplicado al paciente aunque se reintente el proceso. |
| **RNF-04** | Puntualidad | Riesgos del día siguiente calculados antes de las 05:00. |
| **RNF-05** | Disponibilidad | Recepción de webhooks 99,5%; si el receptor falla, los estados no se pierden. |
| **RNF-06** | Retención | Registro de auditoría retenido 5 años; datos operativos 2 años en almacenamiento caliente. |

---

## 9. Temas del Programa a Evidenciar
Temas obligatorios en este proyecto: **19 de 20**.

| # | Tema | Evidencia Esperada | Estado |
| :--- | :--- | :--- | :--- |
| **1** | FastAPI I - APIs REST | Exponer al menos una API REST documentada en OpenAPI/Swagger con operaciones CRUD, parámetros de ruta y consulta, y contratos de request/response explícitos. | Obligatorio |
| **2** | FastAPI II - ORM y buenas prácticas | Persistencia relacional mediante ORM, validación de datos con modelos tipados, manejo de errores con códigos HTTP correctos y estructura por capas justificada. | Obligatorio |
| **3** | Docker I - Fundamentos | Cada componente propio empaquetado en imagen reproducible, variables de entorno, dockerignore y evidencia de optimización (tamaño antes/después). | Obligatorio |
| **4** | Docker II - Multi-container | Levantar el ecosistema completo en local con un solo comando, redes, volúmenes persistentes y comunicación entre servicios. | Obligatorio |
| **5** | AWS I - Fundamentos | Cuenta/rol con IAM de mínimo privilegio, región y zonas justificadas, uso de AWS CLI y análisis de costos. | Obligatorio |
| **6** | AWS II - Networking + EC2 | Diseño de red propio (VPC, subredes, tablas de rutas, gateways, Security Groups) y al menos un EC2 justificado. Justificar componentes en subredes privadas por datos de salud. | Obligatorio |
| **7** | AWS III - S3 + RDS | Almacenamiento de objetos con políticas/clases justificadas (retención 5 años auditoría), y BD administrada con backups y conexión segura. | Obligatorio |
| **8** | AWS IV - ECR + ECS | Imágenes publicadas en registro privado y al menos un servicio desplegado sobre clúster de contenedores con definición de tarea versionada. | Obligatorio |
| **9** | AWS V - Fargate + ALB | Servicios en cómputo serverless de contenedores, expuestos detrás de balanceador con health checks y logs centralizados. | Obligatorio |
| **10** | RabbitMQ | Comunicación asíncrona (productores, consumidores, exchanges, colas, routing keys, ACK y persistencia). Órdenes de envío y webhooks desacoplados sin duplicar mensajes. | Obligatorio |
| **11** | Airflow I - Fundamentos | Orquestación batch mediante DAGs con dependencias, reintentos, programación y parámetros (riesgo diario, consolidación de admisiones y recordatorios). | Obligatorio |
| **12** | Airflow II - Celery + RabbitMQ | Ejecución distribuida de tareas con workers, broker y BD de metadatos en contenedores. | Obligatorio |
| **13** | Spark I - Fundamentos | Jobs distribuidos con esquemas explícitos (no inferidos) y uso consciente de transformaciones y acciones. | Obligatorio |
| **14** | Spark II - Data Processing | Transformaciones de negocio con selección, filtros, columnas derivadas, agregaciones, joins y funciones. | Obligatorio |
| **15** | Spark III - ETL + Performance | Pipeline ETL con particionamiento, formato columnar, caché y evidencia medible de optimización (tiempos, shuffle, planes de ejecución). | Obligatorio |
| **16** | Spark + S3 + ECS/Fargate | Jobs contenedorizados que leen/escriben en S3 y se ejecutan en la nube sobre contenedores. | Obligatorio |
| **17** | CI/CD I - Aplicaciones | Flujo Git con ramas y PRs, pipeline que ejecute lint, pruebas, build, publicación y despliegue. | Obligatorio |
| **18** | CI/CD II - Data Engineering | Pipeline de datos con pruebas de jobs, validación de DAGs, controles de calidad y versionamiento. | Obligatorio |
| **19** | EKS - Introducción | Despliegue de al menos un componente en Kubernetes y análisis comparativo ECS vs EKS. | Opcional (Bono) |
| **20** | Arquitectura + Power BI + Final | Arquitectura end-to-end, Data Lake por capas, modelo dimensional, Power BI, observabilidad y presentación ejecutiva. | Obligatorio |

---

## 10. Lo que el Equipo Debe Definir

### 10.1 Decisiones Generales
* Diseño y arquitectura end-to-end con diagrama propio (componentes, flujos síncronos y asíncronos).
* Infraestructura AWS (región, AZs, red, seguridad, IAM).
* Dimensionamiento de recursos (CPU, RAM, almacenamiento, réplicas/workers) con evidencia.
* Estimación de costos mensuales (Dev y Prod) en AWS Pricing Calculator con supuestos explícitos.
* Estrategia de datos (capas del Data Lake, formatos, particionamiento, modelo dimensional).
* Estrategia de despliegue, secretos, rollback y observabilidad (métricas, logs, alarmas).
* Registro de decisiones de arquitectura (ADR) con alternativas evaluadas.

### 10.2 Preguntas Específicas del Caso
1. ¿Cómo se garantiza que un reintento no envíe dos veces el mismo recordatorio?
2. ¿Qué componentes tocan datos identificables y cómo se aíslan en red e IAM?
3. ¿Cómo se implementa un registro de auditoría inmutable y cuánto cuesta retenerlo 5 años?
4. ¿Qué pasa si un archivo de admisiones llega dos días tarde? ¿Qué se recalcula?

---

## 11. Entregables

| ID | Entregable | Descripción | Semana |
| :--- | :--- | :--- | :--- |
| **E-01** | Documento de arquitectura | Diagramas lógicos/físicos end-to-end, componentes, flujos y mínimo 5 ADR (v1 en S1, final en S6). | S1-S6 |
| **E-02** | Repositorio de código | Git con README, estructura por componentes, ramas y PRs revisados. | S1-S6 |
| **E-03** | Seed de datos | Scripts versionados, semilla fija, volumen parametrizable, idempotentes y con defectos configurables. | S1 |
| **E-04** | Ambiente local reproducible | Ecosistema completo levanta con un único comando documentado (incluyendo seed). | S2 |
| **E-05** | API(s) documentadas | Contrato OpenAPI exportado y colección de pruebas con casos felices y de error. | S2 |
| **E-06** | Diseño infraestructura AWS | Diagrama de red, inventario, políticas IAM y justificación. | S3 |
| **E-07** | Análisis de costos mensuales | Export de AWS Pricing Calculator + tabla por ambiente, supuestos y alternativas. | S3 y S6 |
| **E-08** | Pipelines de datos | DAGs y jobs distribuidos versionados, parametrizados e idempotentes. | S4 |
| **E-09** | Pipelines CI/CD | Pipelines de app y datos con evidencia de ejecuciones exitosas y fallidas. | S5 |
| **E-10** | Diccionario y modelo dimensional | Descripción de tablas/campos, linaje y diagrama dimensional. | S6 |
| **E-11** | Tablero Power BI | Archivo `.pbix` y capturas respondiendo las preguntas de negocio. | S6 |
| **E-12** | Runbook operativo | Cómo desplegar, monitorear, reprocesar, escalar y recuperarse de fallas. | S6 |
| **E-13** | Informe de rendimiento | Mediciones antes/después en procesamiento distribuido y API. | S5 |
| **E-14** | Demo end-to-end y presentación | Presentación (15m) + demo en vivo en AWS (15m) + preguntas (10m). | S6 |
| **E-15** | Evaluación impacto privacidad | Inventario de datos sensibles, flujos, controles y riesgos residuales. | S3 |
| **E-16** | Simulación de política | Comparación de inasistencia y costos con y sin la política usando el histórico. | S6 |

---

## 12. Criterios de Aceptación

### 12.1 Criterios Específicos del Caso
* **CA-01:** Una cita sin admisión a los 21 minutos y sin cancelación previa queda marcada como inasistencia.
* **CA-02:** Una cita cancelada 3 horas antes cuenta como inasistencia; cancelada 5 horas antes, no.
* **CA-03:** Un paciente con 2 inasistencias en 6 meses recibe riesgo Alto y dos recordatorios (72 h y 24 h).
* **CA-04:** Un recordatorio programado para las 21:00 se reprograma a las 07:00 del siguiente día hábil.
* **CA-05:** Al reintentar el proceso de envío tres veces, el paciente recibe un solo mensaje por recordatorio.
* **CA-06:** La API de coordinadores nunca propone sobre-agenda en especialidades no sobre-agendables.
* **CA-07:** Tras una respuesta `CANCELO`, el cupo aparece disponible para lista de espera en menos de 10 minutos.
* **CA-08:** Una consulta a la capa analítica no permite identificar a un paciente individual con condición crónica.
* **CA-09:** Cada consulta de datos de paciente vía API genera un registro de auditoría con usuario, fecha y recurso.
* **CA-10:** Archivos de admisiones con codificación Latin-1 y separador `;` se integran correctamente.

### 12.2 Criterios Transversales
* **CT-01:** El ecosistema completo levanta en local con un único comando y un README permite ejecutarlo en menos de 30 minutos.
* **CT-02:** Ninguna credencial o secreto está en el repositorio ni en las imágenes; el CI falla si detecta secretos.
* **CT-03:** Toda la infraestructura está etiquetada (`proyecto`, `ambiente`, `responsable`) y puede destruirse y recrearse.
* **CT-04:** El pipeline de CI bloquea el merge a `main` si fallan lint, pruebas o validación de DAGs.
* **CT-05:** El análisis de costos compara al menos dos alternativas con supuestos verificables.
* **CT-06:** Todas las BD simuladas se pueblan exclusivamente mediante el seed (reproducible y sin duplicados).
* **CT-07:** La solución funciona end-to-end en AWS hasta el tablero de Power BI en la demo en vivo.
* **CT-08:** Los procesos batch son idempotentes.
* **CT-09:** Existe al menos una alarma configurada y demostrada en vivo ante una falla provocada.
* **CT-10:** El tablero de Power BI responde todas las preguntas de negocio y cuadra con una consulta de control.

---

## 13. Preguntas de Negocio para el Tablero (Power BI)
1. ¿Cuál es la tasa de inasistencia por sede, especialidad, franja, día de la semana y grupo de edad?
2. ¿Cuál es la ocupación efectiva por profesional y sede?
3. ¿Qué efecto tuvieron los recordatorios por nivel de riesgo?
4. ¿Cuánto cuestan los mensajes enviados y cuántas inasistencias evitaron (estimado)?
5. ¿Cuántos cupos de sobre-agenda se usaron y cuántos terminaron en sala colapsada (más de 3 pacientes esperando)?
6. ¿Influye el clima o la anticipación del agendamiento en la inasistencia?

---

## 14. Restricciones, Supuestos y Fuera de Alcance
* **Restricciones:** Solo datos sintéticos o públicos; clasificación de riesgo por reglas explícitas (no ML); componentes con datos identificables en redes privadas.
* **Fuera de alcance:** Historia clínica electrónica, integración real con proveedores de SMS/WhatsApp, facturación a aseguradoras.

---

## 15. Hitos Sugeridos y Rúbrica de Evaluación

### Cronograma por Semanas
* **Semana 1 (Descubrimiento y diseño):** Reglas de negocio, arquitectura v1, ADRs iniciales, modelo operativo y seed funcionando.
* **Semana 2 (Backend y contenedores):** Fuentes simuladas, APIs con persistencia y ecosistema multi-contenedor local con un solo comando.
* **Semana 3 (Fundamentos AWS):** Red, seguridad, almacenamiento, RDS, ECR/ECS y análisis de costos v1.
* **Semana 4 (Mensajería, orquestación y procesamiento):** Flujo asíncrono (RabbitMQ), DAGs en Airflow distribuido y primeros jobs en Spark.
* **Semana 5 (Rendimiento, CI/CD y Kubernetes):** ETL optimizado en la nube, CI/CD de app y datos, componente en EKS e informe de rendimiento.
* **Semana 6 (Integración end-to-end y cierre):** Integración en AWS, modelo dimensional, Power BI, observabilidad, costos finales, runbook y demo en vivo.

### Peso de Evaluación
* **Ingeniería de datos:** 20%
* **Comprensión del negocio y reglas:** 15%
* **Arquitectura y decisiones:** 15%
* **Infraestructura AWS y costos:** 15%
* **Analítica y comunicación:** 15%
* **Backend y mensajería:** 10%
* **DevOps y CI/CD:** 10%

> **🚨 Penalizaciones:** Credenciales expuestas (-15%), infraestructura sin destruir tras la demo que genere costos (-10%), demo que no ejecuta en vivo (-10%), estimación de costos sin supuestos (-5%).