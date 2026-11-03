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
- **21% de inasistencias**; en algunas especialidades supera el 30%.
- **Recordatorios enviados a todos por igual**, con costo alto y bajo efecto.
- **Sobre-agenda manual** que a veces genera salas de espera colapsadas.
- **Datos sensibles** copiados en hojas de cálculo sin control de acceso.
- **Indicadores de productividad** calculados de forma distinta en cada sede.

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
- **F1** aporta el histórico de comportamiento de asistencia (edad, género, becas, condiciones crónicas, SMS recibido, días de anticipación). El equipo debe mapearlo al modelo de ClínicaRed.
- **F1** contiene edades negativas y valores atípicos; su tratamiento debe documentarse.
- **F6** se usa para analizar si el clima influye en la inasistencia.

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

- **F2:** Generador de citas con distribución realista por especialidad y franja; incluye reprogramaciones y cancelaciones con anticipación variable.
- **F3:** Archivos por sede con formatos ligeramente distintos (separador, codificación de caracteres, nombres de columnas) y archivos que llegan tarde o no llegan.
- **F4:** API que simule latencias variables, errores 5xx y webhooks duplicados o fuera de orden; debe permitir simular respuestas de pacientes (`CONFIRMO` / `CANCELO`).
- Todos los datos de pacientes deben ser sintéticos.

### 5.3 Problemas de Calidad de Datos Conocidos
Los datos llegarán con los siguientes defectos (las fuentes simuladas deben inyectarlos deliberadamente con una tasa configurable):
- Pacientes duplicados con variaciones en el nombre o el documento.
- Citas con fecha de agendamiento posterior a la fecha de la cita.
- Archivos de admisiones con registros de citas inexistentes.
- Webhooks de estado repetidos o con estados que retroceden (leído -> enviado).
- Codificaciones de caracteres mezcladas (UTF-8 / Latin-1).

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