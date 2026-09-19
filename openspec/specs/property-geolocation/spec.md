# property-geolocation Specification

## Purpose

Ubica geográficamente cada propiedad inmobiliaria y permite visualizarla, individualmente o junto con el resto del catálogo, en un mapa interactivo basado en Google Maps.

## Requirements

### Requirement: Asignar coordenadas geográficas a una propiedad
El sistema SHALL permitir asociar una latitud y una longitud a una propiedad, ya sea indicadas directamente o derivadas de su dirección.

#### Scenario: Asignación directa de coordenadas
- **WHEN** se crea o edita una propiedad indicando latitud y longitud válidas
- **THEN** el sistema almacena esas coordenadas asociadas a la propiedad

#### Scenario: Rechazo de coordenadas fuera de rango
- **WHEN** se envía una latitud fuera del rango [-90, 90] o una longitud fuera del rango [-180, 180]
- **THEN** el sistema rechaza la operación e informa que las coordenadas no son válidas

### Requirement: Geocodificación automática desde dirección
Cuando una propiedad se crea o edita con una dirección pero sin coordenadas explícitas, el sistema SHALL obtener automáticamente latitud y longitud a partir de esa dirección mediante el servicio de geocodificación de Google Maps.

#### Scenario: Geocodificación exitosa
- **WHEN** se crea una propiedad indicando una dirección válida y sin coordenadas explícitas
- **THEN** el sistema obtiene y almacena las coordenadas correspondientes a esa dirección

#### Scenario: Dirección no geocodificable
- **WHEN** se crea una propiedad con una dirección que el servicio de geocodificación no puede resolver
- **THEN** el sistema informa que no fue posible obtener coordenadas para esa dirección y permite continuar sin ubicación en mapa

### Requirement: Visualización de una propiedad en mapa
El sistema SHALL mostrar, en la ficha de detalle de una propiedad con coordenadas asignadas, un mapa interactivo de Google Maps centrado en su ubicación.

#### Scenario: Propiedad con coordenadas
- **WHEN** se consulta el detalle de una propiedad que tiene coordenadas asignadas
- **THEN** el sistema muestra un mapa centrado en esas coordenadas con un marcador señalando la propiedad

#### Scenario: Propiedad sin coordenadas
- **WHEN** se consulta el detalle de una propiedad que no tiene coordenadas asignadas
- **THEN** el sistema muestra la ficha de la propiedad sin el componente de mapa, en lugar de mostrar un error

### Requirement: Visualización de múltiples propiedades en mapa
El sistema SHALL permitir visualizar en un único mapa todas las propiedades del listado (o del resultado filtrado) que tengan coordenadas asignadas, cada una representada con su propio marcador.

#### Scenario: Listado con varias propiedades geolocalizadas
- **WHEN** se visualiza el mapa del catálogo con un listado que incluye varias propiedades con coordenadas asignadas
- **THEN** el sistema muestra un marcador por cada una de esas propiedades en el mapa

#### Scenario: Selección de un marcador
- **WHEN** se selecciona el marcador de una propiedad en el mapa del listado
- **THEN** el sistema muestra información básica de esa propiedad (al menos tipo de vivienda, precio y foto de portada)

### Requirement: Manejo de error del servicio de Google Maps
El sistema SHALL manejar de forma controlada los casos en que el servicio de Google Maps no esté disponible o la clave de API no sea válida, sin impedir el resto de la funcionalidad del catálogo.

#### Scenario: Clave de API inválida o servicio no disponible
- **WHEN** el servicio de Google Maps no responde o la clave de API configurada no es válida
- **THEN** el sistema informa de que el mapa no está disponible temporalmente y mantiene accesible el resto de la información de la propiedad

### Requirement: Búsqueda de propiedades por área dibujada en el mapa
El sistema SHALL permitir definir un área geográfica arbitraria (un polígono de al menos 3 vértices, cada uno con latitud y longitud) y devolver únicamente las propiedades geolocalizadas cuyas coordenadas caen dentro de esa área.

#### Scenario: Búsqueda dentro de un área válida
- **WHEN** se solicita el listado de propiedades indicando un polígono válido de al menos 3 vértices
- **THEN** el sistema devuelve únicamente las propiedades cuyas coordenadas están contenidas dentro de ese polígono

#### Scenario: Área sin propiedades dentro
- **WHEN** se solicita el listado de propiedades indicando un polígono válido que no contiene ninguna propiedad geolocalizada
- **THEN** el sistema devuelve una lista vacía, sin considerarlo un error

#### Scenario: Polígono inválido
- **WHEN** se solicita una búsqueda por área indicando menos de 3 vértices o vértices con coordenadas fuera de rango
- **THEN** el sistema rechaza la búsqueda e informa que el área indicada no es válida

#### Scenario: Combinación con otros filtros
- **WHEN** se solicita una búsqueda por área geográfica junto con otros filtros del catálogo (tipo de vivienda, operación, precio, etc.)
- **THEN** el sistema devuelve únicamente las propiedades que además de estar dentro del área cumplen el resto de filtros indicados
