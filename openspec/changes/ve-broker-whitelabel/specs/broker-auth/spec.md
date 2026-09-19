## Purpose

Autenticación del broker/staff para administrar propiedades, medios y ajustes, dejando el catálogo público en solo lectura.

## ADDED Requirements

### Requirement: Iniciar y cerrar sesión de staff
El sistema SHALL permitir a un usuario staff iniciar sesión con email y contraseña y cerrar sesión, usando una cookie httpOnly.

#### Scenario: Login válido
- **WHEN** se envían credenciales de un usuario staff existente
- **THEN** el sistema establece una cookie de sesión y permite acceder a las rutas de administración

#### Scenario: Login inválido
- **WHEN** se envían email o contraseña incorrectos
- **THEN** el sistema rechaza el acceso sin revelar cuál de los dos campos falló

#### Scenario: Cerrar sesión
- **WHEN** un staff autenticado cierra sesión
- **THEN** la cookie se invalida y las mutaciones posteriores se rechazan

### Requirement: Proteger mutaciones del catálogo
Las operaciones de crear, editar, publicar, pausar, eliminar propiedades y de subir o borrar medios SHALL exigir sesión de staff.

#### Scenario: Alta pública rechazada
- **WHEN** un visitante no autenticado intenta crear o editar una propiedad
- **THEN** el sistema rechaza la operación

#### Scenario: Staff crea y publica
- **WHEN** un staff autenticado crea una propiedad y la marca como publicada
- **THEN** el sistema la persiste y pasa a mostrarla en el catálogo público
