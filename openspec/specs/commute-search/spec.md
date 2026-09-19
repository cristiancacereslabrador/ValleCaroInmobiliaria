# commute-search Specification

## Purpose

Permite buscar propiedades del catálogo según el tiempo máximo de trayecto hasta un destino habitual (por ejemplo, el trabajo), en vez de solo por proximidad geométrica, para un medio de transporte elegido.

## Requirements

### Requirement: Búsqueda por tiempo máximo de trayecto a un destino
Dado un destino (dirección o coordenadas), un medio de transporte (coche, transporte público o a pie) y un tiempo máximo en minutos, el sistema SHALL devolver únicamente las propiedades geolocalizadas cuyo tiempo de trayecto estimado hasta ese destino, para ese medio de transporte, no supere el tiempo indicado.

#### Scenario: Búsqueda con parámetros válidos
- **WHEN** se solicita el listado de propiedades indicando un destino válido, un medio de transporte soportado y un tiempo máximo en minutos
- **THEN** el sistema devuelve únicamente las propiedades geolocalizadas cuyo trayecto estimado hasta el destino no supera ese tiempo

#### Scenario: Destino no resoluble
- **WHEN** se solicita la búsqueda indicando un destino (dirección) que no puede resolverse a coordenadas
- **THEN** el sistema rechaza la búsqueda e informa que el destino indicado no es válido

#### Scenario: Sin propiedades dentro del tiempo indicado
- **WHEN** se solicita la búsqueda y ninguna propiedad geolocalizada cumple el tiempo máximo indicado
- **THEN** el sistema devuelve una lista vacía, sin considerarlo un error

#### Scenario: Combinación con otros filtros del catálogo
- **WHEN** se solicita una búsqueda por trayecto junto con otros filtros del catálogo (tipo, operación, precio, etc.)
- **THEN** el sistema devuelve únicamente las propiedades que además de cumplir el tiempo de trayecto cumplen el resto de filtros indicados

### Requirement: Manejo de error del servicio de cálculo de trayectos
El sistema SHALL manejar de forma controlada los casos en que el servicio externo de cálculo de trayectos no esté disponible, informando del problema sin romper el resto de la búsqueda del catálogo.

#### Scenario: Servicio no disponible
- **WHEN** el servicio externo de cálculo de trayectos no responde o devuelve un error
- **THEN** el sistema informa de que la búsqueda por trayecto no está disponible temporalmente, permitiendo seguir usando el resto de filtros del catálogo
