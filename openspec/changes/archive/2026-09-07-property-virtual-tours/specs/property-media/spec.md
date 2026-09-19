## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Listar medios de una propiedad
El sistema SHALL permitir listar todas las fotos, videos y tours virtuales asociados a una propiedad.

#### Scenario: Listado de medios existentes
- **WHEN** se solicita el listado de medios de una propiedad que tiene fotos, videos y/o tours virtuales asociados
- **THEN** el sistema devuelve todos esos medios asociados a esa propiedad, indicando su tipo

#### Scenario: Listado de medios de una propiedad sin contenido
- **WHEN** se solicita el listado de medios de una propiedad que no tiene ningún medio asociado
- **THEN** el sistema devuelve una lista vacía
