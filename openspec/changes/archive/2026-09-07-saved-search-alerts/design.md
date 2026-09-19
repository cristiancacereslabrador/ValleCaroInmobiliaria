## Context

Extiende el MVP (`apps/api` NestJS/TypeORM/MariaDB, `apps/web` Next.js) reutilizando los criterios de filtrado ya existentes en `property-catalog` (y los que añada `advanced-search-filters`, si ya está implementado). Ver proposal.md - Why/What Changes para la motivación de resolver esto sin cuentas de usuario.

## Goals / Non-Goals

**Goals:**
- Permitir suscribirse a una búsqueda por email sin fricción de registro.
- Evitar abuso (spam, suscribir emails ajenos) con doble opt-in y rate limiting.
- Notificar de forma fiable ante nuevas coincidencias y ante cambios de precio en propiedades coincidentes.

**Non-Goals:**
- No se construye autenticación de usuario ni un panel de "mis alertas" persistente más allá de los enlaces de la propia alerta (decisión explícita del usuario para no ampliar el alcance a cuentas).
- No se reevalúan alertas contra cambios de una propiedad más allá del precio (cambios de superficie, fotos, etc. no disparan notificación) - solo altas nuevas y cambios de precio, que son los dos eventos de mayor valor para quien sigue una búsqueda.

## Decisions

### 1. Criterios de alerta serializados como JSON, no como columnas propias
La alerta guarda sus criterios de búsqueda como un objeto JSON (mismo shape que los query params del listado de propiedades) en una columna `criteria` (tipo JSON en MariaDB), en vez de columnas individuales por filtro.
- **Por qué**: los criterios de filtrado evolucionan con `advanced-search-filters` y futuros changes; una columna JSON evita migrar la tabla de alertas cada vez que se añade un filtro nuevo al catálogo. La evaluación de coincidencia reutiliza la misma lógica de filtrado ya implementada para el listado, aplicada a una única propiedad.

### 2. Envío de email vía SMTP configurable (Nodemailer), sin proveedor transaccional de terceros
Se integra mediante Nodemailer contra un servidor SMTP configurado por variables de entorno, en vez de un proveedor externo (SendGrid, Postmark, etc.).
- **Por qué**: evita depender de una cuenta de un proveedor de terceros para un proyecto de prueba; Nodemailer + SMTP es agnóstico y puede apuntar a cualquier proveedor si se decide cambiarlo más adelante sin tocar la lógica de negocio (queda detrás de un `MailService` propio).
- **Alternativa considerada**: proveedor transaccional (mejor entregabilidad en producción real) - se documenta como mejora futura si el proyecto pasa de prueba a producción real.

### 3. Evaluación de coincidencias mediante eventos internos (`property.created`, `property.priceChanged`), no con un job periódico
Al crear una propiedad, o al editarla cambiando su precio, `PropertiesService` emite un evento interno (`property.created` / `property.priceChanged`) que un listener del módulo de alertas consume para evaluar las alertas activas y encolar los envíos de email correspondientes.
- **Por qué**: para el volumen esperado de un proyecto de prueba, evaluar en el momento del evento es más simple que mantener un job periódico, y notifica sin retraso. El envío de email en sí se hace de forma asíncrona (no bloquea la respuesta de creación/edición de la propiedad) para no acoplar esa latencia al tiempo de envío de emails.
- **Alternativa considerada**: job periódico que compara el estado del catálogo desde la última ejecución contra las alertas - más resiliente ante caídas puntuales del envío de email, pero añade complejidad de programación de tareas no justificada en este alcance; se deja como mejora futura si se detectan notificaciones perdidas por caídas del proceso.
- `property.priceChanged` se emite solo cuando el precio efectivamente cambia en una edición (no en cada edición), reutilizando la misma detección de cambio de precio que introduce `neighborhood-market-insights` para su histórico, si ya está implementado; si no lo está, este change implementa la comparación mínima (precio anterior vs. nuevo) directamente en `PropertiesService`, sin depender de esa tabla de histórico.

### 4. Rate limiting de creación de alertas por IP y por email
Se limita la creación de alertas nuevas por dirección IP (p. ej. máximo 5 por hora) y por email (p. ej. máximo 10 alertas activas simultáneas por dirección), configurable por variable de entorno.
- **Por qué**: es la mitigación mínima razonable contra abuso sin necesidad de CAPTCHA ni cuentas de usuario, acorde a la decisión de mantener el flujo sin login.

## Risks / Trade-offs

- [Evaluar en el momento del evento acopla la lógica de alertas al flujo de alta/edición de propiedad] → Mitigación: el envío de email es asíncrono y con manejo de errores aislado (un fallo de envío no debe hacer fallar la creación/edición de la propiedad); documentado como constraint de implementación.
- [Sin panel de gestión, un usuario que pierda el email de confirmación/baja no tiene otra forma de gestionar su alerta] → Mitigación: aceptado como limitación conocida de este alcance sin cuentas; cada email de notificación repite el enlace de baja, mitigando parcialmente el problema.
- [Un servidor SMTP mal configurado podría bloquear silenciosamente todas las notificaciones] → Mitigación: registrar (log) cada intento de envío fallido para poder diagnosticarlo, sin que el proyecto de prueba requiera alerting operacional adicional.

## Open Questions

Ninguna que cambie specs, approach o tasks.
