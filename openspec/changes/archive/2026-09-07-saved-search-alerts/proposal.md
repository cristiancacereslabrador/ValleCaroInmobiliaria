## Why

Fotocasa destaca por avisar rápido cuando aparece un anuncio nuevo que encaja con lo que el usuario busca, e Idealista además avisa cuando el precio de un anuncio guardado cambia - ambos críticos en zonas de alta demanda o para decidir el momento de comprar. El catálogo actual no tiene ninguna forma de que un interesado se entere de nuevas propiedades o de cambios de precio sin volver a consultar manualmente. El MVP no tiene cuentas de usuario ni login (decisión deliberada), así que esta funcionalidad se resuelve con un modelo de suscripción por email, sin necesidad de autenticación.

## What Changes

- Se permite guardar unos criterios de búsqueda (los mismos filtros ya disponibles en el catálogo: tipo de vivienda, operación, rango de precio, y los añadidos por `advanced-search-filters` si ya están implementados) junto con una dirección de email de contacto, sin necesidad de cuenta ni login.
- La alerta requiere confirmación del email (doble opt-in) antes de activarse, para evitar dar de alta alertas con emails ajenos.
- Cuando se crea una nueva propiedad que coincide con los criterios de una alerta activa, se envía una notificación por email a la dirección asociada.
- Cuando el precio de una propiedad que coincide con los criterios de una alerta activa cambia (sube o baja), se envía una notificación por email indicando el precio anterior y el nuevo.
- Cada email de notificación incluye un enlace de baja que desactiva la alerta sin necesidad de login.

## Capabilities

### New Capabilities
- `saved-search-alerts`: guardar búsquedas con alerta por email (con doble confirmación), notificar por email ante nuevas coincidencias y ante cambios de precio en propiedades coincidentes, y permitir la baja sin necesidad de cuenta de usuario.

### Modified Capabilities
<!-- Ninguna: reutiliza los criterios de filtrado ya existentes en property-catalog sin cambiar su comportamiento. -->

## Impact

- **Backend**: nuevo módulo de alertas (entidad `SavedSearchAlert` con sus criterios serializados, email, estado de confirmación, token de confirmación/baja); integración con un proveedor de envío de email (SMTP o servicio transaccional); lógica que, tras la creación o edición de precio de una propiedad, evalúa las alertas activas y dispara notificaciones para las que coinciden.
- **Frontend**: formulario para guardar una búsqueda con email desde la página de listado (usando los filtros aplicados en ese momento); páginas de confirmación y de baja de alerta accesibles por enlace, sin login.
- **Base de datos**: nueva tabla `saved_search_alerts` (criterios, email, estado, tokens, timestamps).
- **Dependencias externas**: un proveedor de envío de email (a decidir en design.md) - necesita credenciales propias, distintas de las de Google Maps.
- **Riesgo de abuso**: al no requerir cuenta, se necesita mitigar spam/abuso (rate limiting al crear alertas, doble opt-in obligatorio) - detallado en design.md.
