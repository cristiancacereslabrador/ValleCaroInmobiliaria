## Purpose

Estima un rango de precio de venta y de alquiler para un inmueble hipotético (no publicado), a partir de propiedades comparables ya existentes en el catálogo, para ayudar a un propietario a orientarse sobre el valor de su vivienda.

## ADDED Requirements

### Requirement: Estimación de rango de precio a partir de comparables
Dadas las características de un inmueble (tipo de vivienda, ciudad y/o código postal, superficie, número de habitaciones y estado), el sistema SHALL calcular un rango de precio de venta estimado y, si existen comparables en alquiler, un rango de precio de alquiler estimado, a partir de propiedades del catálogo con características parecidas en la misma zona.

#### Scenario: Comparables suficientes para venta
- **WHEN** se solicita una tasación con características para las que existen suficientes propiedades comparables en venta en esa zona (según un umbral mínimo configurable)
- **THEN** el sistema devuelve un rango de precio de venta estimado (mínimo y máximo orientativos)

#### Scenario: Comparables suficientes para alquiler
- **WHEN** se solicita una tasación con características para las que existen suficientes propiedades comparables en alquiler en esa zona
- **THEN** el sistema devuelve un rango de precio de alquiler estimado además del de venta, si aplica

#### Scenario: Comparables insuficientes
- **WHEN** se solicita una tasación para unas características (tipo/zona) que no alcanzan el umbral mínimo de comparables, sea en venta o en alquiler
- **THEN** el sistema informa de que no hay datos suficientes para estimar ese rango, en vez de devolver una estimación poco fiable

#### Scenario: Los resultados son orientativos, no una tasación oficial
- **WHEN** se muestra el resultado de una estimación
- **THEN** el sistema indica explícitamente que se trata de una estimación orientativa basada en el propio catálogo, no de una tasación oficial ni de un informe pericial

### Requirement: Formulario de tasación independiente del catálogo publicado
El sistema SHALL permitir solicitar una estimación de valor indicando las características de un inmueble sin necesidad de que ese inmueble esté publicado como una propiedad del catálogo.

#### Scenario: Solicitud de tasación con datos válidos
- **WHEN** se envían tipo de vivienda, ciudad o código postal, superficie, habitaciones y estado, todos ellos válidos
- **THEN** el sistema procesa la solicitud y devuelve el resultado de la estimación (o la indicación de datos insuficientes)

#### Scenario: Datos obligatorios ausentes
- **WHEN** se solicita una tasación sin indicar tipo de vivienda, zona (ciudad o código postal) o superficie
- **THEN** el sistema rechaza la solicitud e informa qué datos obligatorios faltan
