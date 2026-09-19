# property-media Specification

## Purpose

Gestiona el contenido multimedia asociado a cada propiedad inmobiliaria: carga, listado, orden de visualización y eliminación de fotos, videos y tours virtuales 360°.

## Requirements

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

### Requirement: Subir un tour virtual 360° a una propiedad
El sistema SHALL permitir asociar a una propiedad existente uno o más tours virtuales 360°, cada uno referenciado por una imagen panorámica equirectangular.

#### Scenario: Carga exitosa de un tour virtual
- **WHEN** se sube una imagen panorámica equirectangular como tour virtual 360° a una propiedad existente
- **THEN** el sistema almacena el tour y lo asocia a esa propiedad como un medio de tipo "tour virtual"

#### Scenario: Tour virtual sobre propiedad inexistente
- **WHEN** se intenta subir un tour virtual asociándolo a un identificador de propiedad que no existe
- **THEN** el sistema rechaza la operación e informa que la propiedad no existe

### Requirement: Visualización interactiva del tour virtual
El sistema SHALL permitir visualizar de forma interactiva (zoom y rotación) cada tour virtual 360° asociado a una propiedad, desde la ficha de detalle de esa propiedad.

#### Scenario: Ficha con al menos un tour virtual
- **WHEN** se consulta el detalle de una propiedad que tiene al menos un tour virtual asociado
- **THEN** la ficha muestra un visor interactivo para cada tour virtual, permitiendo rotar y hacer zoom sobre la panorámica

#### Scenario: Ficha sin tours virtuales
- **WHEN** se consulta el detalle de una propiedad sin tours virtuales asociados
- **THEN** la ficha se muestra igualmente, sin la sección de tour virtual

### Requirement: Validación de formatos y tamaño de archivo
El sistema SHALL validar el formato y el tamaño de cada archivo multimedia antes de aceptarlo, rechazando formatos no soportados o archivos que excedan el tamaño máximo permitido.

#### Scenario: Rechazo por formato no soportado
- **WHEN** se intenta subir un archivo cuyo formato no está entre los formatos de imagen o video soportados
- **THEN** el sistema rechaza la carga e informa que el formato no es soportado

#### Scenario: Rechazo por tamaño excesivo
- **WHEN** se intenta subir un archivo que supera el tamaño máximo permitido
- **THEN** el sistema rechaza la carga e informa que el archivo excede el tamaño máximo permitido

### Requirement: Listar medios de una propiedad
El sistema SHALL permitir listar todas las fotos, videos y tours virtuales asociados a una propiedad.

#### Scenario: Listado de medios existentes
- **WHEN** se solicita el listado de medios de una propiedad que tiene fotos, videos y/o tours virtuales asociados
- **THEN** el sistema devuelve todos esos medios asociados a esa propiedad, indicando su tipo

#### Scenario: Listado de medios de una propiedad sin contenido
- **WHEN** se solicita el listado de medios de una propiedad que no tiene ningún medio asociado
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
