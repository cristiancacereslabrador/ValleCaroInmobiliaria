## Context

Extiende el MVP ya implementado (`apps/api` NestJS/TypeORM/MariaDB, `apps/web` Next.js). Ver proposal.md - Why/What Changes para la motivación. La entidad `Property` y el endpoint de listado (`GET /api/v1/properties`) ya existen; este change los amplía sin romper el contrato existente (los filtros nuevos son adicionales, no sustituyen a los actuales).

## Goals / Non-Goals

**Goals:**
- Añadir a `Property` los atributos `hasElevator`, `needsRenovation`, `isBankOwned` y sus filtros correspondientes.
- Permitir búsqueda por polígono geográfico arbitrario, combinable con el resto de filtros.

**Non-Goals:**
- No se introduce un motor de búsqueda geoespacial dedicado (PostGIS-like) - el volumen de datos de este proyecto de prueba no lo justifica.
- No se rediseña la UI de filtros más allá de añadir los controles nuevos - la organización general del listado no cambia.

## Decisions

### 1. Nuevas columnas simples en `properties`, sin tabla aparte
`hasElevator`, `needsRenovation` e `isBankOwned` se añaden como columnas booleanas nullable en la tabla `properties` existente (no como una tabla de "atributos" genérica).
- **Por qué**: son atributos de cardinalidad fija y conocida de antemano; una tabla de atributos genérica añadiría complejidad de JOIN sin beneficio real en este alcance.
- **Alternativa considerada**: tabla `property_attributes` clave-valor - descartada por sobre-ingeniería.

### 2. Filtrado por polígono: comprobación punto-en-polígono en la capa de aplicación, no en SQL espacial
Dado el volumen esperado (proyecto de prueba), el filtrado por polígono se resuelve así: la consulta SQL sigue trayendo las propiedades que cumplen el resto de filtros (con coordenadas no nulas), y la comprobación de "¿está el punto dentro del polígono?" se aplica en memoria en el backend con el algoritmo estándar de ray-casting.
- **Por qué**: evita depender de tipos espaciales de MariaDB (`ST_Contains`/`ST_Within`, disponibles pero añaden complejidad de índices/versión) para un volumen de datos que no lo requiere; mantiene la lógica testeable en TypeScript puro.
- **Alternativa considerada**: usar las funciones espaciales nativas de MariaDB con una columna `POINT` y un índice espacial - se documenta como evolución natural si el catálogo crece mucho (cambio incremental futuro), no necesaria ahora.
- El polígono se recibe como un array de `{lat, lng}` en el propio request de listado (`GET /api/v1/properties?area=...` o vía `POST` si la codificación en query string resulta poco práctica por tamaño - a decidir en implementación según el número de vértices esperado).

### 3. Dibujo de polígono en frontend: Drawing Library de Google Maps
El frontend usa la Drawing Library de la Maps JavaScript API (ya cargada para el resto de mapas) para permitir al usuario dibujar el polígono a mano alzada sobre el mapa del listado, y convierte el resultado en la lista de vértices que se envía al backend.
- **Por qué**: es la extensión oficial de la misma librería ya integrada (`@react-google-maps/api` expone `DrawingManager`), evita añadir una dependencia de mapas distinta.

## Risks / Trade-offs

- [Comprobación punto-en-polígono en memoria no escala a catálogos muy grandes] → Mitigación: aceptable para el volumen de un proyecto de prueba; si el catálogo crece, migrar a funciones espaciales de MariaDB es un cambio acotado a la capa de repositorio, sin afectar la spec ni el contrato de la API.
- [Los nuevos filtros booleanos con valor "no indicado" (null) pueden confundirse con "false" en la UI] → Mitigación: la spec exige tratar "no indicado" como estado propio (no forzar false), y el frontend debe distinguir "sin especificar" de "no" en los controles de filtro.

## Open Questions

- Si el número de vértices del polígono es grande, decidir en implementación si el listado por área se expone como `GET` con el polígono serializado en query string o como `POST` dedicado - no cambia la spec (que describe comportamiento, no transporte) ni el approach general.
