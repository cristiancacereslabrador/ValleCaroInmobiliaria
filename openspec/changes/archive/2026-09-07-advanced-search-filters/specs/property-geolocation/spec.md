## ADDED Requirements

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
