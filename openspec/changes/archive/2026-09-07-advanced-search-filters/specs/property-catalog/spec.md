## MODIFIED Requirements

### Requirement: Especificaciones inherentes a la propiedad
Cada propiedad SHALL almacenar las siguientes especificaciones propias del sector inmobiliario: superficie (m²), número de habitaciones, número de baños, planta, año de construcción, estado del inmueble (por ejemplo: a estrenar, buen estado, a reformar), precio, tipo de operación (venta o alquiler), certificado energético, si tiene ascensor, si necesita reforma y si procede de un banco o de un proceso de embargo.

#### Scenario: Registrar especificaciones completas
- **WHEN** se crea una propiedad indicando superficie, habitaciones, baños, planta, año de construcción, estado, precio, tipo de operación y certificado energético
- **THEN** el sistema almacena todas las especificaciones asociadas a esa propiedad

#### Scenario: Tipo de operación limitado a venta o alquiler
- **WHEN** se crea o edita una propiedad indicando un tipo de operación distinto de "venta" o "alquiler"
- **THEN** el sistema rechaza la operación e informa que el tipo de operación no es válido

#### Scenario: Registrar ascensor, necesidad de reforma y procedencia bancaria
- **WHEN** se crea o edita una propiedad indicando si tiene ascensor, si necesita reforma y si procede de un banco o embargo
- **THEN** el sistema almacena esos tres atributos asociados a la propiedad

#### Scenario: Atributos opcionales sin indicar
- **WHEN** se crea una propiedad sin indicar explícitamente si tiene ascensor, si necesita reforma o si procede de un banco
- **THEN** el sistema acepta la propiedad y trata esos atributos como no indicados (falso/desconocido), sin rechazar la creación

### Requirement: Listar y filtrar propiedades
El sistema SHALL permitir listar las propiedades del catálogo y filtrarlas al menos por tipo de vivienda, tipo de operación (venta/alquiler), rango de precio, presencia de ascensor, planta baja, necesidad de reforma y procedencia bancaria.

#### Scenario: Listado sin filtros
- **WHEN** se solicita el listado de propiedades sin aplicar ningún filtro
- **THEN** el sistema devuelve todas las propiedades activas del catálogo

#### Scenario: Listado filtrado por tipo de vivienda y operación
- **WHEN** se solicita el listado de propiedades filtrando por un tipo de vivienda concreto y por tipo de operación "alquiler"
- **THEN** el sistema devuelve únicamente las propiedades de ese tipo de vivienda disponibles en alquiler

#### Scenario: Listado filtrado por rango de precio
- **WHEN** se solicita el listado de propiedades indicando un precio mínimo y un precio máximo
- **THEN** el sistema devuelve únicamente las propiedades cuyo precio está dentro de ese rango

#### Scenario: Filtrar por ascensor
- **WHEN** se solicita el listado de propiedades filtrando por "con ascensor"
- **THEN** el sistema devuelve únicamente las propiedades marcadas con ascensor

#### Scenario: Filtrar por planta baja
- **WHEN** se solicita el listado de propiedades filtrando por "planta baja"
- **THEN** el sistema devuelve únicamente las propiedades cuya planta registrada corresponde a planta baja

#### Scenario: Filtrar por necesidad de reforma
- **WHEN** se solicita el listado de propiedades filtrando por "necesita reforma"
- **THEN** el sistema devuelve únicamente las propiedades marcadas como necesitadas de reforma

#### Scenario: Filtrar por procedencia bancaria
- **WHEN** se solicita el listado de propiedades filtrando por "procedente de banco"
- **THEN** el sistema devuelve únicamente las propiedades marcadas como procedentes de un banco o embargo

#### Scenario: Combinar varios filtros nuevos con los existentes
- **WHEN** se solicita el listado combinando tipo de vivienda, operación, rango de precio y al menos uno de los nuevos filtros (ascensor, planta baja, reforma o procedencia bancaria)
- **THEN** el sistema devuelve únicamente las propiedades que cumplen simultáneamente todos los filtros indicados
