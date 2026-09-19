## Purpose

Muestra los servicios y puntos de interés cercanos a una propiedad (colegios, transporte público y supermercados) para ayudar a valorar el entorno del inmueble, a partir de sus coordenadas geográficas.

## ADDED Requirements

### Requirement: Consulta de puntos de interés cercanos
Dada una propiedad con coordenadas geográficas asignadas, el sistema SHALL obtener los puntos de interés cercanos de las categorías colegio, transporte público y supermercado dentro de un radio configurable, junto con su distancia aproximada a la propiedad.

#### Scenario: Propiedad con coordenadas y puntos de interés en el radio
- **WHEN** se consulta el entorno de una propiedad con coordenadas asignadas que tiene colegios, paradas de transporte y/o supermercados dentro del radio configurado
- **THEN** el sistema devuelve esos puntos de interés agrupados por categoría, cada uno con su distancia aproximada a la propiedad

#### Scenario: Propiedad sin puntos de interés en el radio
- **WHEN** se consulta el entorno de una propiedad con coordenadas asignadas que no tiene puntos de interés de ninguna categoría dentro del radio configurado
- **THEN** el sistema devuelve el entorno vacío para esa propiedad, sin considerarlo un error

#### Scenario: Propiedad sin coordenadas
- **WHEN** se consulta el entorno de una propiedad que no tiene coordenadas asignadas
- **THEN** el sistema informa que no hay información de entorno disponible para esa propiedad, sin bloquear la consulta del resto de su ficha

### Requirement: Manejo de error del servicio de puntos de interés
El sistema SHALL manejar de forma controlada los casos en que el servicio externo de puntos de interés no esté disponible, sin impedir el resto de la funcionalidad de la ficha de propiedad.

#### Scenario: Servicio no disponible
- **WHEN** el servicio externo de puntos de interés no responde o devuelve un error
- **THEN** el sistema informa de que la información de entorno no está disponible temporalmente y mantiene accesible el resto de la ficha de la propiedad

### Requirement: Visualización del entorno en la ficha de propiedad
El sistema SHALL mostrar, en la ficha de detalle de una propiedad, una sección de entorno con los puntos de interés cercanos agrupados por categoría (colegios, transporte, supermercados).

#### Scenario: Ficha con entorno disponible
- **WHEN** se consulta el detalle de una propiedad con información de entorno disponible
- **THEN** la ficha muestra la sección de entorno con los puntos de interés agrupados por categoría

#### Scenario: Ficha sin entorno disponible
- **WHEN** se consulta el detalle de una propiedad sin información de entorno disponible (sin coordenadas o por error del servicio)
- **THEN** la ficha se muestra igualmente, omitiendo o indicando como no disponible la sección de entorno
