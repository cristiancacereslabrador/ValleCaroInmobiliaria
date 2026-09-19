## 1. Backend - modelo de datos y envío de email

- [x] 1.1 Crear la entidad y migración de `SavedSearchAlert` (criterios JSON, email, estado, token de confirmación, token de baja, timestamps) y verificar que la migración se aplica correctamente
- [x] 1.2 Implementar `MailService` sobre Nodemailer/SMTP configurable por variables de entorno, y verificar con un test (contra un servidor SMTP de prueba tipo MailHog/Ethereal) que el envío funciona

## 2. Backend - guardar alerta y doble opt-in

- [x] 2.1 Implementar el endpoint de creación de alerta (criterios + email) validando el formato del email, y verificar con tests que crea la alerta en estado pendiente y rechaza emails con formato inválido
- [x] 2.2 Implementar el envío del email de confirmación al crear la alerta y el endpoint de confirmación vía token, y verificar con tests que confirmar activa la alerta y que un token inválido/expirado es rechazado
- [x] 2.3 Implementar la expiración de alertas nunca confirmadas tras el plazo configurable, y verificar con tests que una alerta expirada no se considera activa

## 3. Backend - notificación de coincidencias nuevas

- [x] 3.1 Implementar el evento interno `property.created` y su listener en el módulo de alertas, y verificar con tests que se dispara al crear una propiedad
- [x] 3.2 Implementar la evaluación de una propiedad nueva contra los criterios de las alertas activas (reutilizando la lógica de filtrado del listado), y verificar con tests los escenarios de `specs/saved-search-alerts/spec.md` (coincide con una alerta, no coincide con ninguna, coincide con varias)
- [x] 3.3 Implementar el envío asíncrono del email de notificación por cada coincidencia, y verificar con tests que un fallo de envío no bloquea ni revierte la creación de la propiedad

## 4. Backend - notificación de cambio de precio

- [x] 4.1 Implementar el evento interno `property.priceChanged` (emitido cuando una edición cambia el precio) y su listener en el módulo de alertas, y verificar con tests que se dispara solo cuando el precio realmente cambia
- [x] 4.2 Implementar la evaluación de la propiedad editada contra los criterios de las alertas activas y el envío del email de cambio de precio (con precio anterior y nuevo), y verificar con tests los escenarios de `specs/saved-search-alerts/spec.md` referidos a cambio de precio

## 5. Backend - baja y prevención de abuso

- [x] 5.1 Implementar el endpoint de baja vía token, y verificar con tests que desactiva la alerta y que acceder de nuevo al mismo enlace informa de que ya estaba dada de baja sin error
- [x] 5.2 Implementar el rate limiting de creación de alertas por IP y por email, y verificar con tests que las solicitudes por encima del límite configurado son rechazadas

## 6. Frontend - guardar alerta desde el listado

- [x] 6.1 Añadir en la página de listado un formulario para guardar la búsqueda actual (con los filtros aplicados) junto con un email, y verificar manualmente que crea la alerta y muestra la confirmación de "revisa tu email"

## 7. Frontend - páginas de confirmación y baja

- [x] 7.1 Implementar la página de confirmación de alerta (accedida desde el enlace del email) y verificar manualmente los casos de confirmación exitosa y de token inválido/expirado
- [x] 7.2 Implementar la página de baja de alerta (accedida desde el enlace del email) y verificar manualmente los casos de baja exitosa y de alerta ya dada de baja

## 8. Verificación end-to-end

- [x] 8.1 Ejecutar el flujo completo (guardar una alerta con email de prueba → confirmar → crear una propiedad que coincide → comprobar el email de notificación recibido → editar el precio de esa propiedad → comprobar el email de cambio de precio → darse de baja mediante el enlace → crear otra propiedad coincidente y comprobar que ya no se notifica) contra el entorno local levantado con Docker Compose (incluyendo un SMTP de prueba), y verificar que se comporta según los escenarios de `specs/saved-search-alerts/spec.md`
