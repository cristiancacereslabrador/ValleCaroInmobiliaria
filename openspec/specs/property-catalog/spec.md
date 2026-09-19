# property-catalog Specification

## Purpose

Gestiona el ciclo de vida de las propiedades inmobiliarias del catálogo: alta, edición, baja y consulta de inmuebles, junto con el tipo de vivienda y las especificaciones propias del sector inmobiliario asociadas a cada una.

## Requirements

### Requirement: Tipos de vivienda soportados
El sistema SHALL soportar, como mínimo, los siguientes tipos de vivienda para cada propiedad: piso, casa, chalet, ático, dúplex, local comercial y terreno. Toda propiedad SHALL tener exactamente un tipo de vivienda asignado.

#### Scenario: Asignar un tipo de vivienda válido
- **WHEN** se crea una propiedad indicando un tipo de vivienda de la lista soportada (por ejemplo, "chalet")
- **THEN** el sistema acepta la propiedad y almacena ese tipo de vivienda

#### Scenario: Rechazar un tipo de vivienda no soportado
- **WHEN** se crea o edita una propiedad indicando un tipo de vivienda que no está en la lista soportada
- **THEN** el sistema rechaza la operación e informa que el tipo de vivienda no es válido

### Requirement: Especificaciones inherentes a la propiedad
Cada propiedad SHALL almacenar las siguientes especificaciones propias del sector inmobiliario: superficie (m²), número de habitaciones, número de baños, planta, año de construcción, estado del inmueble (por ejemplo: a estrenar, buen estado, a reformar), precio, tipo de operación (venta o alquiler), certificado energético, si tiene ascensor, si necesita reforma, si procede de un banco o de un proceso de embargo, ciudad y código postal.

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

#### Scenario: Registrar ciudad y código postal
- **WHEN** se crea o edita una propiedad indicando ciudad y código postal
- **THEN** el sistema almacena ambos valores asociados a la propiedad

#### Scenario: Ciudad y código postal obligatorios para poder calcular insights de zona
- **WHEN** se crea una propiedad sin ciudad o sin código postal
- **THEN** el sistema acepta la propiedad igualmente, pero esa propiedad queda excluida del cálculo de evolución de precio por zona hasta que se completen esos datos

### Requirement: Crear propiedad inmobiliaria
El sistema SHALL permitir dar de alta una nueva propiedad inmobiliaria indicando su tipo de vivienda y sus especificaciones inherentes.

#### Scenario: Alta exitosa de una propiedad
- **WHEN** se envían los datos obligatorios de una propiedad (tipo de vivienda y especificaciones requeridas)
- **THEN** el sistema crea la propiedad, le asigna un identificador único y la deja disponible para consulta

#### Scenario: Rechazo por datos obligatorios ausentes
- **WHEN** se intenta crear una propiedad sin uno o más datos obligatorios (por ejemplo, sin tipo de vivienda o sin precio)
- **THEN** el sistema rechaza la creación e informa qué campos obligatorios faltan

### Requirement: Editar propiedad inmobiliaria
El sistema SHALL permitir editar los datos y especificaciones de una propiedad existente.

#### Scenario: Edición exitosa
- **WHEN** se envían cambios válidos sobre una propiedad existente (por ejemplo, actualizar el precio o el estado)
- **THEN** el sistema actualiza la propiedad y refleja los nuevos valores en consultas posteriores

#### Scenario: Edición de una propiedad inexistente
- **WHEN** se intenta editar una propiedad cuyo identificador no existe en el sistema
- **THEN** el sistema rechaza la operación e informa que la propiedad no existe

### Requirement: Eliminar propiedad inmobiliaria
El sistema SHALL permitir dar de baja (eliminar) una propiedad existente del catálogo.

#### Scenario: Baja exitosa
- **WHEN** se solicita la eliminación de una propiedad existente
- **THEN** el sistema elimina la propiedad y deja de mostrarla en el listado y en la consulta de detalle

#### Scenario: Baja de una propiedad inexistente
- **WHEN** se solicita la eliminación de una propiedad cuyo identificador no existe
- **THEN** el sistema rechaza la operación e informa que la propiedad no existe

### Requirement: Consultar detalle de una propiedad
El sistema SHALL permitir consultar el detalle completo de una propiedad existente, incluyendo su tipo de vivienda y todas sus especificaciones.

#### Scenario: Consulta exitosa
- **WHEN** se solicita el detalle de una propiedad existente por su identificador
- **THEN** el sistema devuelve el tipo de vivienda y todas las especificaciones almacenadas de esa propiedad

#### Scenario: Consulta de una propiedad inexistente
- **WHEN** se solicita el detalle de una propiedad cuyo identificador no existe
- **THEN** el sistema informa que la propiedad no fue encontrada

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
