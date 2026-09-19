## MODIFIED Requirements

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
