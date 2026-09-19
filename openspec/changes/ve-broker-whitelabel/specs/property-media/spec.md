## ADDED Requirements

### Requirement: Mutaciones de medios restringidas al staff
Subir, borrar o marcar portada de un medio SHALL exigir sesión de staff. La consulta de medios de una propiedad publicada permanece pública.

#### Scenario: Visitante no puede subir
- **WHEN** un visitante no autenticado intenta subir un archivo a una propiedad
- **THEN** el sistema rechaza la operación

#### Scenario: Staff sube foto
- **WHEN** un staff autenticado sube una foto válida
- **THEN** el sistema la almacena y la asocia a la propiedad
