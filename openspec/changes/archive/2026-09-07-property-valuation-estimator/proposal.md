## Why

Fotocasa ofrece "Valora tu vivienda": el usuario indica las características de un inmueble propio (no necesariamente publicado) y recibe una estimación de precio de venta/alquiler comparando con propiedades similares del catálogo. El catálogo actual solo permite consultar precios de propiedades ya publicadas, no estimar el valor de una que no lo está.

## What Changes

- Se añade una herramienta de tasación: el usuario introduce tipo de vivienda, ciudad/código postal, superficie, habitaciones y estado, y el sistema estima un rango de precio de venta y de alquiler comparando con propiedades del catálogo con características parecidas en esa zona.
- Si no hay datos suficientes en el catálogo para esa zona/tipo, el sistema lo indica explícitamente en vez de dar una estimación poco fiable.

## Capabilities

### New Capabilities
- `property-valuation-estimator`: estimación de un rango de precio de venta y de alquiler para un inmueble hipotético, a partir de propiedades comparables del propio catálogo.

### Modified Capabilities
<!-- Ninguna: es una capability de solo lectura sobre datos ya existentes en property-catalog. -->

## Impact

- **Backend**: nuevo endpoint que recibe las características del inmueble a tasar, busca comparables (mismo tipo, zona, rango de superficie/habitaciones) entre propiedades del catálogo (activas y con histórico si `neighborhood-market-insights` ya está implementado) y calcula un rango de precio (p. ej. percentiles del precio/m² de los comparables aplicado a la superficie indicada).
- **Frontend**: nuevo formulario de tasación (independiente del catálogo de propiedades publicadas) con el resultado como rango estimado y aviso de estimación orientativa.
- **Base de datos**: ninguna, es una consulta derivada de los datos ya existentes.
- **Dependencia parcial**: la calidad de la estimación mejora si `neighborhood-market-insights` (ciudad/código postal) ya está implementado; sin él, la zona se aproxima con lo que exista disponible en `property-catalog` en ese momento (a decidir en design.md).
