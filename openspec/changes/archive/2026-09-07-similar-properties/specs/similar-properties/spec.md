## Purpose

Calcula y muestra, en la ficha de una propiedad, otras propiedades del catálogo con características parecidas, para ofrecer alternativas relevantes sin que el usuario repita la búsqueda.

## ADDED Requirements

### Requirement: Cálculo de propiedades similares
Dada una propiedad, el sistema SHALL calcular un listado de otras propiedades activas del catálogo que compartan su tipo de vivienda y tipo de operación, tengan una superficie dentro de un ±20% de la suya y un número de habitaciones dentro de ±1, excluyendo siempre la propia propiedad.

#### Scenario: Existen propiedades similares suficientes
- **WHEN** se solicitan las propiedades similares a una propiedad que tiene otras propiedades activas cumpliendo los criterios de similitud
- **THEN** el sistema devuelve hasta un máximo configurable de resultados (por defecto 6), ordenados por similitud, sin incluir la propia propiedad

#### Scenario: No hay propiedades similares
- **WHEN** se solicitan las propiedades similares a una propiedad que no tiene ninguna otra propiedad activa cumpliendo los criterios
- **THEN** el sistema devuelve una lista vacía, sin considerarlo un error

#### Scenario: Priorizar cercanía geográfica cuando ambas están geolocalizadas
- **WHEN** se calculan propiedades similares y tanto la propiedad de referencia como varias candidatas tienen coordenadas asignadas
- **THEN** el sistema prioriza en el orden del resultado a las candidatas geográficamente más cercanas a la propiedad de referencia

### Requirement: Visualización de propiedades similares en la ficha
El sistema SHALL mostrar, en la ficha de detalle de una propiedad, una sección de "propiedades similares" con la foto de portada, el precio y el tipo de vivienda de cada resultado.

#### Scenario: Ficha con propiedades similares disponibles
- **WHEN** se consulta el detalle de una propiedad que tiene propiedades similares
- **THEN** la ficha muestra la sección con esas propiedades como tarjetas navegables a su propia ficha

#### Scenario: Ficha sin propiedades similares
- **WHEN** se consulta el detalle de una propiedad sin propiedades similares
- **THEN** la ficha se muestra igualmente, omitiendo la sección de propiedades similares
