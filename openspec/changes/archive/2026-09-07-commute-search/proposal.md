## Why

Fotocasa permite buscar vivienda según el tiempo de trayecto hasta un destino habitual (trabajo, colegio) en coche, transporte público o a pie, en vez de solo por distancia en línea recta. El catálogo actual solo permite delimitar zona por proximidad geométrica (radio o polígono dibujado), no por tiempo real de desplazamiento.

## What Changes

- Se añade la posibilidad de buscar propiedades indicando una dirección de destino, un medio de transporte (coche, transporte público, a pie) y un tiempo máximo de trayecto, devolviendo solo las propiedades geolocalizadas cuyo trayecto estimado hasta ese destino no supere el tiempo indicado.

## Capabilities

### New Capabilities
- `commute-search`: búsqueda de propiedades por tiempo máximo de trayecto hasta un destino, según el medio de transporte elegido.

### Modified Capabilities
<!-- Ninguna: es un filtro adicional sobre el listado ya existente, sin cambiar su comportamiento por defecto. -->

## Impact

- **Backend**: integración con la Distance Matrix API de Google (u otra equivalente) para calcular el tiempo de trayecto entre las propiedades candidatas (con coordenadas) y el destino indicado, para el medio de transporte elegido.
- **Frontend**: nuevo control de búsqueda ("cerca de..." con dirección, medio de transporte y tiempo máximo) en la página de listado.
- **Base de datos**: ninguna, es un filtro calculado en el momento de la consulta.
- **Coste/cuota**: la Distance Matrix API tiene coste por consulta según el número de orígenes x destinos - relevante si el catálogo crece mucho (ver design.md para mitigación).
