## Purpose

Permite guardar criterios de búsqueda del catálogo junto con un email de contacto y recibir una notificación por correo cuando aparezcan propiedades nuevas que coincidan, sin necesidad de crear una cuenta de usuario.

## ADDED Requirements

### Requirement: Guardar una búsqueda con alerta por email
El sistema SHALL permitir guardar un conjunto de criterios de búsqueda del catálogo junto con una dirección de email, sin requerir cuenta de usuario ni login.

#### Scenario: Guardar alerta con criterios y email válidos
- **WHEN** se solicita guardar una alerta indicando unos criterios de búsqueda válidos y una dirección de email con formato válido
- **THEN** el sistema crea la alerta en estado pendiente de confirmación

#### Scenario: Email con formato inválido
- **WHEN** se solicita guardar una alerta indicando una dirección de email con formato inválido
- **THEN** el sistema rechaza la creación e informa que el email no es válido

### Requirement: Confirmación de la alerta por email (doble opt-in)
El sistema SHALL requerir que el email asociado a una alerta confirme su creación mediante un enlace de confirmación antes de que la alerta quede activa y pueda generar notificaciones.

#### Scenario: Envío de email de confirmación al crear la alerta
- **WHEN** se crea una alerta en estado pendiente de confirmación
- **THEN** el sistema envía un email a la dirección indicada con un enlace de confirmación único

#### Scenario: Confirmación exitosa
- **WHEN** se accede al enlace de confirmación de una alerta pendiente antes de que expire
- **THEN** el sistema activa la alerta, que a partir de ese momento puede generar notificaciones

#### Scenario: Alerta nunca confirmada
- **WHEN** una alerta permanece en estado pendiente de confirmación más allá de un plazo máximo configurable
- **THEN** el sistema no la considera activa para ninguna notificación y puede descartarla

### Requirement: Notificación de nuevas coincidencias
Cuando se crea una propiedad nueva en el catálogo, el sistema SHALL evaluarla contra los criterios de todas las alertas activas y enviar una notificación por email a cada alerta cuyos criterios coincidan con esa propiedad.

#### Scenario: Nueva propiedad coincide con una alerta activa
- **WHEN** se crea una propiedad que cumple los criterios de una alerta activa
- **THEN** el sistema envía un email de notificación a la dirección asociada a esa alerta, incluyendo información básica de la propiedad

#### Scenario: Nueva propiedad no coincide con ninguna alerta
- **WHEN** se crea una propiedad que no cumple los criterios de ninguna alerta activa
- **THEN** el sistema no envía ninguna notificación

#### Scenario: Una propiedad coincide con varias alertas
- **WHEN** se crea una propiedad que cumple los criterios de varias alertas activas (incluso con el mismo email en más de una)
- **THEN** el sistema envía una notificación independiente por cada alerta que coincide

### Requirement: Notificación de cambio de precio en una propiedad guardada
Cuando el precio de una propiedad cambia, el sistema SHALL enviar una notificación por email a cada alerta activa cuyos criterios coincidan con esa propiedad (antes o después del cambio), indicando el precio anterior y el nuevo precio.

#### Scenario: Bajada o subida de precio en una propiedad coincidente
- **WHEN** el precio de una propiedad que coincide con los criterios de una alerta activa cambia (sube o baja)
- **THEN** el sistema envía un email a esa alerta indicando el precio anterior y el nuevo precio

#### Scenario: Cambio de precio en una propiedad que no coincide con ninguna alerta
- **WHEN** el precio de una propiedad que no coincide con los criterios de ninguna alerta activa cambia
- **THEN** el sistema no envía ninguna notificación de cambio de precio

### Requirement: Baja de una alerta sin necesidad de cuenta
El sistema SHALL permitir dar de baja una alerta activa o pendiente mediante un enlace de baja único, incluido en cada email relacionado con esa alerta, sin requerir login.

#### Scenario: Baja mediante el enlace incluido en una notificación
- **WHEN** se accede al enlace de baja incluido en un email de notificación o de confirmación
- **THEN** el sistema desactiva esa alerta y deja de enviarle notificaciones futuras

#### Scenario: Enlace de baja ya usado
- **WHEN** se accede de nuevo a un enlace de baja de una alerta que ya estaba desactivada
- **THEN** el sistema informa de que la alerta ya estaba dada de baja, sin generar un error inesperado

### Requirement: Prevención de abuso al crear alertas
El sistema SHALL limitar la creación de alertas para mitigar abuso (por ejemplo, límite de alertas creadas por dirección IP o por email en una ventana de tiempo).

#### Scenario: Creación de alertas dentro del límite
- **WHEN** se crean alertas por debajo del límite configurado en la ventana de tiempo correspondiente
- **THEN** el sistema las acepta con normalidad

#### Scenario: Creación de alertas por encima del límite
- **WHEN** se supera el límite configurado de creación de alertas en la ventana de tiempo correspondiente
- **THEN** el sistema rechaza las solicitudes adicionales e informa que se ha superado el límite permitido
