---
id: costos-y-teardown-aws
title: Guía Operativa de Costos y Protocolo de Teardown en AWS
sidebar_label: Costos y Teardown (HU 06 - Task 6)
---

# Gestión de Costos y Protocolo de Teardown en AWS (US 06 - Task 6)

## 1. Contexto y Objetivos Operativos

El despliegue del ecosistema **ClínicaRed** en Amazon Web Services (AWS) requiere una gobernanza financiera (FinOps) estricta. El objetivo de este documento es definir el presupuesto mensual estimado generado mediante la **AWS Pricing Calculator**, justificar el gasto de los servicios aprovisionados en la región **US East (Ohio / `us-east-2`)** y formalizar el procedimiento estándar de apagado (*teardown*) para garantizar que los recursos inactivos no consuman créditos ni generen facturación no deseada fuera de los ciclos de prueba[cite: 7, 8].

---

## 2. Estimación Mensual Oficial (AWS Pricing Calculator)

La arquitectura de producción implementa un esquema desacoplado y serverless en contenedores (**Opción A**)[cite: 7]. Frente a un esquema monolítico sobre máquinas virtuales tradicionales (**Opción B**), el desglose financiero mensual proyectado es el siguiente[cite: 7]:

### Comparativa de Costos Mensuales

| Componente de Infraestructura | Opción A: Contenedores ECS (Elegida) | Opción B: Servidor EC2 Tradicional | Parámetros Técnicos Evaluados |
| :--- | :---: | :---: | :--- |
| **Cómputo Backend** | **$18,02 USD** | **$17,58 USD** | **Fargate:** 1 tarea continua, Linux x86, 1 GB RAM, 20 GB almacenamiento efímero (730 hrs/mes).<br/>**EC2:** Instancia `t3.small` On-Demand (2 vCPU, 2 GB RAM) con 30 GB EBS gp2[cite: 8]. |
| **Balanceo y Enrutamiento** | **$16,66 USD** | **$0,00 USD** | **Opción A:** 1 Application Load Balancer (ALB) para enrutamiento HTTP/HTTPS, SSL offloading y health checks.<br/>**Opción B:** Exposición directa por IP pública de la instancia sin balanceador[cite: 7]. |
| **Base de Datos Gestionada** | **$15,44 USD** | **$15,44 USD** | **Amazon RDS PostgreSQL:** Instancia `db.t3.micro`, 20 GB SSD gp2, arquitectura Single-AZ, uso On-Demand continuo (730 hrs/mes)[cite: 8]. |
| **Costos Iniciales (Upfront)** | **$0,00 USD** | **$0,00 USD** | Modelo 100% bajo demanda sin compromisos a largo plazo[cite: 7]. |
| **COSTO MENSUAL TOTAL** | **$50,12 USD / mes** | **$33,02 USD / mes** | **Delta mensual: +$17,10 USD / mes**[cite: 7] |

---

## 3. Retorno de Inversión y Justificación FinOps

La diferencia mensual de **$17,10 USD** a favor de la **Opción A ($50,12 USD/mes)** está fundamentada en dos factores de resiliencia operativa[cite: 7]:

1. **Application Load Balancer ($16,66 USD):** Absorbe picos de tráfico transaccional, distribuye la carga entre tareas y ejecuta *health checks* automáticos en la ruta `/health` de FastAPI, previniendo indisponibilidad del servicio[cite: 7].
2. **Abstracción del Host con AWS Fargate ($18,02 USD vs $17,58 USD en EC2):** Por una diferencia de solo **$0,44 USD**, Fargate elimina la sobrecarga operativa de parchar el kernel del sistema operativo, configurar el daemon de Docker y gestionar el espacio en disco del host[cite: 8].

---

## 4. Estrategia FinOps: Modalidad Horario Hábil (Desarrollo)

Para entornos que no exigen disponibilidad 24/7 (pruebas de integración, validaciones de sprints o demos académicas), se aplica la política de detención programada fuera de horario laboral (240 horas/mes):

* **AWS Fargate (240 hrs/mes):** ~$5,92 USD.
* **Amazon RDS PostgreSQL (Detenido fuera de turno):** ~$6,50 USD (únicamente cobro de almacenamiento de 20 GB).
* **Application Load Balancer (Pausado o eliminado entre pruebas):** ~$5,47 USD.
* **Presupuesto Mensual Reducido:** **~$17,89 USD / mes** (ahorro superior al **64%** frente a la operación continua).

---

## 5. Procedimiento de Teardown con AWS CLI

Al concluir cada sesión de prueba, auditoría o benchmark, debe ejecutarse el siguiente protocolo en orden estricto mediante la terminal con credenciales de AWS configuradas en la región `us-east-2`:

### Paso 1: Escalar las Tareas de Fargate a Cero
Cancela inmediatamente el consumo de cómputo serverless de CPU y memoria:
```bash
aws ecs update-service \
    --cluster clinicared-cluster \
    --service clinicared-backend-service \
    --desired-count 0 \
    --region us-east-2
```

### Paso 2: Eliminar el Application Load Balancer
El balanceador factura $0,0225 por hora sin importar si recibe tráfico. Debe destruirse al finalizar pruebas prolongadas:
```bash
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names clinicared-alb \
    --region us-east-2 \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

if [ "$ALB_ARN" != "None" ] && [ -n "$ALB_ARN" ]; then
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" --region us-east-2
    echo "Application Load Balancer clinicared-alb eliminado con éxito."
fi
```

### Paso 3: Pausar o Eliminar la Base de Datos RDS
* **Opción Temporal (Pausar por hasta 7 días para retomar pruebas):**
  ```bash
  aws rds stop-db-instance \
      --db-instance-identifier clinicared-db \
      --region us-east-2
  ```
* **Opción Definitiva (Eliminar la instancia guardando snapshot de seguridad):**
  ```bash
  aws rds delete-db-instance \
      --db-instance-identifier clinicared-db \
      --final-db-snapshot-identifier clinicared-db-final-snapshot \
      --region us-east-2
  ```

### Paso 4: Purgar Imágenes Obsoletas en Amazon ECR
Libera almacenamiento en el registro de contenedores eliminando compilaciones intermedias sin etiqueta (*untagged*):
```bash
aws ecr batch-delete-image \
    --repository-name clinicared-backend \
    --image-ids "$(aws ecr list-images --repository-name clinicared-backend --region us-east-2 --filter tagStatus=UNTAGGED --query 'imageIds[*]' --output json)" \
    --region us-east-2
```

### Paso 5: Limpieza de Logs en CloudWatch
Elimina el grupo de logs generado por los contenedores para evitar cargos acumulados de almacenamiento:
```bash
aws logs delete-log-group \
    --log-group-name /ecs/clinicared-backend \
    --region us-east-2
```

---

## 6. Lista de Chequeo de Auditoría de Cierre

Antes de desconectar la sesión de trabajo, valida el estado de la cuenta en la consola de AWS o CLI:

- [ ] Tareas Fargate en estado `STOPPED` (Count = 0).
- [ ] Application Load Balancer (`clinicared-alb`) eliminado o desasociado.
- [ ] Instancia RDS en estado `stopped` o eliminada con snapshot de respaldo.
- [ ] Cero Elastic IPs inactivas asignadas en la VPC (evita penalización de $0,005/hora por IP ociosa).
- [ ] Curva de costos en **AWS Cost Explorer** estabilizada sin consumos imprevistos.