## Why

Idealista y Fotocasa muestran, en la ficha de cada anuncio, propiedades parecidas (mismo tipo, superficie y ubicación similares) para que el usuario tenga alternativas sin repetir la búsqueda desde cero. El catálogo actual solo muestra el detalle aislado de la propiedad.

## What Changes

- Se añade, en la ficha de cada propiedad, un listado de "propiedades similares": mismo tipo de vivienda y tipo de operación, superficie dentro de un ±20%, número de habitaciones dentro de ±1, y (si ambas están geolocalizadas) dentro de una distancia razonable.

## Capabilities

### New Capabilities
- `similar-properties`: cálculo y visualización de propiedades similares a una propiedad dada, a partir de sus propias características.

### Modified Capabilities
<!-- Ninguna: es una capability de solo lectura sobre datos ya existentes en property-catalog. -->

## Impact

- **Backend**: nuevo endpoint que, dado el id de una propiedad, consulta el catálogo con los criterios de similitud y devuelve un listado acotado (p. ej. máximo 6 resultados), excluyendo la propia propiedad y las que no estén activas.
- **Frontend**: nueva sección en la ficha de propiedad con las propiedades similares (tarjeta con foto de portada, precio y tipo).
- **Base de datos**: ninguna, es una consulta derivada de los datos ya existentes.
