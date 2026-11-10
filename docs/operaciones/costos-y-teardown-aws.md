---
id: costos-y-teardown-aws
title: Gestión de Costos y Protocolo de Teardown en AWS
sidebar_label: Costos y Teardown (HU 06 - Task 6)
---

# Gestión de Costos y Protocolo de Teardown en AWS (US 06 - Task 6)

## 1. Contexto y Objetivos Operativos

El despliegue del ecosistema **ClínicaRed** en Amazon Web Services (AWS) implementa un modelo desacoplado y serverless basado en contenedores dentro de la región **US East (Ohio / `us-east-2`)**.

El objetivo de este documento es formalizar el presupuesto mensual extraído de la **AWS Pricing Calculator** para los servicios en producción, establecer las estrategias de ahorro en horarios no productivos y definir el protocolo estándar de desmantelamiento (*teardown*) mediante AWS CLI para prevenir la facturación por recursos ociosos.

---

## 2. Presupuesto Mensual Oficial (AWS Pricing Calculator)

El dimensionamiento de la infraestructura cubre las necesidades transaccionales del backend FastAPI y la persistencia de datos:

| Servicio AWS | Tipo de Recurso / Configuración Técnica | Costo Mensual |
| :--- | :--- | :---: |
| **AWS Fargate** | 1 Tarea continua (Linux x86, 1 GB RAM, 20 GB almacenamiento efímero, 730 hrs/mes) | **$18,02 USD** |
| **Application Load Balancer** | 1 ALB dedicado para terminación SSL, enrutamiento y health checks | **$16,66 USD** |
| **Amazon RDS for PostgreSQL** | Instancia `db.t3.micro`, 20 GB almacenamiento SSD gp2, Single-AZ (730 hrs/mes) | **$15,44 USD** |
| **Costo Inicial (Upfront)** | Modelo bajo demanda (On-Demand) sin compromiso temporal | **$0,00 USD** |
| **TOTAL MENSUAL ESTIMADO** | **Arquitectura Completa ClínicaRed (24/7)** | **$50,12 USD / mes** |

---

## 3. Estrategia FinOps: Modo Desarrollo / Horario Hábil

Para entornos de prueba, validaciones académicas y auditorías que no requieran disponibilidad continua (730 horas/mes), se aplica la política de detención programada fuera de turno (estimado sobre 240 horas/mes):

* **AWS Fargate (240 hrs/mes):** ~$5,92 USD.
* **Amazon RDS PostgreSQL (Detenido fuera de turno):** ~$6,50 USD (únicamente cobro por retención del volumen de 20 GB gp2).
* **Application Load Balancer (Pausado o eliminado entre sesiones):** ~$5,47 USD.
* **Presupuesto Mensual Reducido:** **~$17,89 USD / mes** (reducción del **64.3%** respecto a la ejecución continua).

---

## 4. Protocolo de Teardown con AWS CLI

Al finalizar cada jornada de prueba o ciclo de evaluación, debe ejecutarse el siguiente protocolo en estricto orden secuencial con credenciales configuradas en la región `us-east-2`:

### Paso 1: Escalar las Tareas de Fargate a Cero
Cancela de inmediato la facturación por consumo de CPU y memoria serverless:
```bash
aws ecs update-service \
    --cluster clinicared-cluster \
    --service clinicared-backend-service \
    --desired-count 0 \
    --region us-east-2
```

### Paso 2: Eliminar el Application Load Balancer
El balanceador genera un cobro horario fijo ($0,0225/hora) aun sin recibir solicitudes. Debe liberarse al terminar las pruebas prolongadas:
```bash
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names clinicared-alb \
    --region us-east-2 \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

if [ "$ALB_ARN" != "None" ] && [ -n "$ALB_ARN" ]; then
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" --region us-east-2
    echo "Application Load Balancer clinicared-alb eliminado correctamente."
fi
```

### Paso 3: Pausar o Eliminar la Base de Datos RDS
* **Pausar temporalmente (hasta 7 días de detención continua):**
  ```bash
  aws rds stop-db-instance \
      --db-instance-identifier clinicared-db \
      --region us-east-2
  ```
* **Eliminar definitivamente preservando un snapshot de seguridad:**
  ```bash
  aws rds delete-db-instance \
      --db-instance-identifier clinicared-db \
      --final-db-snapshot-identifier clinicared-db-final-snapshot \
      --region us-east-2
  ```

### Paso 4: Purgar Imágenes Obsoletas en Amazon ECR
Elimina imágenes intermedias o sin tag para evitar cobros residuales por cuota de disco en el registro:
```bash
aws ecr batch-delete-image \
    --repository-name clinicared-backend \
    --image-ids "$(aws ecr list-images --repository-name clinicared-backend --region us-east-2 --filter tagStatus=UNTAGGED --query 'imageIds[*]' --output json)" \
    --region us-east-2
```

### Paso 5: Limpieza de Logs en CloudWatch
Remueve el grupo de logs generado durante las pruebas para liberar espacio:
```bash
aws logs delete-log-group \
    --log-group-name /ecs/clinicared-backend \
    --region us-east-2
```

---

## 5. Lista de Chequeo de Auditoría de Cierre

Antes de finalizar la sesión de trabajo, valida en consola o mediante CLI:

- [ ] Tareas Fargate en estado `STOPPED` (Count = 0).
- [ ] Application Load Balancer (`clinicared-alb`) eliminado de la VPC.
- [ ] Instancia RDS en estado `stopped` o eliminada con snapshot guardado.
- [ ] Ninguna IP elástica sin asociar en la cuenta.
- [ ] Tablero de **AWS Cost Explorer** validado sin consumos imprevistos activos.