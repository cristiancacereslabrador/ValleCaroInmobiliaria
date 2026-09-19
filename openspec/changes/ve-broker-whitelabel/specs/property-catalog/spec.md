## MODIFIED Requirements

### Requirement: Tipos de vivienda soportados
El sistema SHALL soportar, como mínimo, los siguientes tipos de inmueble: apartamento, casa, quinta, townhouse, penthouse, estudio, local comercial, galpón/bodega, oficina, terreno y finca. Toda propiedad SHALL tener exactamente un tipo asignado.

#### Scenario: Asignar un tipo venezolano válido
- **WHEN** se crea una propiedad indicando tipo "quinta"
- **THEN** el sistema acepta la propiedad y almacena ese tipo

#### Scenario: Rechazar un tipo de España eliminado
- **WHEN** se crea o edita una propiedad indicando un tipo que ya no existe (`piso`, `chalet`, `ático`, `dúplex` o cualquier valor fuera de la lista soportada)
- **THEN** el sistema rechaza la operación

### Requirement: Especificaciones inherentes a la propiedad
Cada propiedad SHALL poder almacenar: título, descripción, superficie construida (m²), superficie de terreno (m²), habitaciones, baños, puestos de estacionamiento, planta, año de construcción, estado del inmueble, precio en USD, tipo de operación (venta o alquiler), dirección, estado, municipio, parroquia, urbanización, ciudad, código postal opcional, si tiene ascensor, si necesita reforma, y amenidades locales (planta eléctrica, cisterna, pozo de agua, gas directo, vigilancia, conjunto cerrado, amoblado, aire acondicionado, piscina, jardín). El sistema SHALL NOT almacenar certificado energético ni procedencia bancaria.

#### Scenario: Registrar ficha venezolana
- **WHEN** se crea una propiedad con título, precio en USD, apartamento, estacionamiento y parroquia
- **THEN** el sistema almacena esos datos asociados a la propiedad

#### Scenario: Certificado energético no se acepta
- **WHEN** se envía un campo de certificado energético al crear o editar
- **THEN** el sistema lo ignora o rechaza; no persiste ese dato

### Requirement: Listar y filtrar propiedades
El sistema SHALL permitir listar las propiedades **publicadas** y filtrarlas al menos por tipo, operación, rango de precio, estado (entidad federal), municipio, ascensor, planta baja y necesidad de reforma. El catálogo público SHALL NOT incluir borradores ni pausadas.

#### Scenario: Listado público sin filtros
- **WHEN** se solicita el listado público sin filtros
- **THEN** el sistema devuelve únicamente propiedades con estado de publicación "publicado"

#### Scenario: Borrador invisible al público
- **WHEN** una propiedad está en borrador o pausada
- **THEN** no aparece en el listado público ni en su ficha pública

#### Scenario: Filtrar por estado venezolano
- **WHEN** se filtra por estado "Táchira"
- **THEN** el sistema devuelve solo propiedades de ese estado

## ADDED Requirements

### Requirement: Estado de publicación
Cada propiedad SHALL tener un estado de publicación: borrador, publicado o pausado. La creación autenticada SHALL dejar la propiedad en borrador salvo que el staff indique lo contrario.

#### Scenario: Publicar
- **WHEN** el staff marca una propiedad en borrador como publicada
- **THEN** pasa a aparecer en el catálogo público

#### Scenario: Pausar
- **WHEN** el staff pausa una propiedad publicada
- **THEN** deja de aparecer en el catálogo público sin eliminarse
