## Purpose

Gestiona el contenido multimedia asociado a cada propiedad inmobiliaria: carga, listado, orden de visualización y eliminación de fotos y videos.

## ADDED Requirements

### Requirement: Subir fotos a una propiedad
El sistema SHALL permitir asociar múltiples fotos a una propiedad existente.

#### Scenario: Carga exitosa de una foto
- **WHEN** se sube un archivo de imagen en un formato soportado a una propiedad existente
- **THEN** el sistema almacena la foto y la asocia a esa propiedad

#### Scenario: Carga de varias fotos en una misma propiedad
- **WHEN** se suben múltiples fotos a la misma propiedad
- **THEN** el sistema almacena todas las fotos y las asocia a esa propiedad sin sobrescribir las existentes

#### Scenario: Carga de foto sobre propiedad inexistente
- **WHEN** se intenta subir una foto asociándola a un identificador de propiedad que no existe
- **THEN** el sistema rechaza la operación e informa que la propiedad no existe

### Requirement: Subir videos a una propiedad
El sistema SHALL permitir asociar múltiples videos a una propiedad existente.

#### Scenario: Carga exitosa de un video
- **WHEN** se sube un archivo de video en un formato soportado a una propiedad existente
- **THEN** el sistema almacena el video y lo asocia a esa propiedad

### Requirement: Validación de formatos y tamaño de archivo
El sistema SHALL validar el formato y el tamaño de cada archivo multimedia antes de aceptarlo, rechazando formatos no soportados o archivos que excedan el tamaño máximo permitido.

#### Scenario: Rechazo por formato no soportado
- **WHEN** se intenta subir un archivo cuyo formato no está entre los formatos de imagen o video soportados
- **THEN** el sistema rechaza la carga e informa que el formato no es soportado

#### Scenario: Rechazo por tamaño excesivo
- **WHEN** se intenta subir un archivo que supera el tamaño máximo permitido
- **THEN** el sistema rechaza la carga e informa que el archivo excede el tamaño máximo permitido

### Requirement: Listar medios de una propiedad
El sistema SHALL permitir listar todas las fotos y videos asociados a una propiedad.

#### Scenario: Listado de medios existentes
- **WHEN** se solicita el listado de medios de una propiedad que tiene fotos y videos asociados
- **THEN** el sistema devuelve todas las fotos y videos asociados a esa propiedad

#### Scenario: Listado de medios de una propiedad sin contenido
- **WHEN** se solicita el listado de medios de una propiedad que no tiene fotos ni videos asociados
- **THEN** el sistema devuelve una lista vacía

### Requirement: Eliminar un medio de una propiedad
El sistema SHALL permitir eliminar una foto o un video previamente asociado a una propiedad.

#### Scenario: Eliminación exitosa de un medio
- **WHEN** se solicita la eliminación de una foto o video existente asociado a una propiedad
- **THEN** el sistema elimina ese medio y deja de incluirlo en el listado de medios de la propiedad

#### Scenario: Eliminación de un medio inexistente
- **WHEN** se solicita la eliminación de un medio cuyo identificador no existe
- **THEN** el sistema rechaza la operación e informa que el medio no existe

### Requirement: Foto de portada de la propiedad
El sistema SHALL permitir designar una de las fotos asociadas a una propiedad como foto de portada, usada para representar la propiedad en el listado del catálogo.

#### Scenario: Designar foto de portada
- **WHEN** se marca una de las fotos existentes de una propiedad como foto de portada
- **THEN** el sistema la establece como portada y la devuelve como imagen principal al consultar el listado o el detalle de esa propiedad

#### Scenario: Propiedad sin foto de portada asignada
- **WHEN** se consulta el listado o detalle de una propiedad que tiene fotos pero ninguna marcada como portada
- **THEN** el sistema utiliza la primera foto cargada como portada por defecto
