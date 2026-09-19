## Context

Extiende el MVP (`apps/api` NestJS/TypeORM/MariaDB, `apps/web` Next.js) y asume que `advanced-search-filters` ya está implementado y archivado (los campos `hasElevator`/`needsRenovation`/`isBankOwned` ya existen en `Property`). Ver proposal.md - Why/What Changes para la motivación de las dos capabilities nuevas (`nearby-services`, `price-trends`) y la modificación de `property-catalog` (ciudad/código postal).

## Goals / Non-Goals

**Goals:**
- Mostrar entorno (colegios, transporte, supermercados) en la ficha de propiedad usando una fuente de datos real (Google Places).
- Calcular evolución de precio/m² por zona usando exclusivamente el histórico propio del catálogo, sin depender de datos de mercado externos.

**Non-Goals:**
- No se integra ninguna fuente de datos de mercado inmobiliario real de terceros (Idealista/Fotocasa no exponen esos datos públicamente, y no es el alcance de un proyecto de prueba).
- No se resuelve la "zona" mediante polígonos de barrio reales (distritos/barrios oficiales) - se usa ciudad + código postal como proxy de zona, que es suficiente para el alcance de este MVP extendido.

## Decisions

### 1. Puntos de interés: Google Places API (Nearby Search), sin cachear resultados en BD inicialmente
El backend llama a la Nearby Search de Google Places en el momento de consultar la ficha de una propiedad (o bajo demanda desde el frontend), filtrando por los tipos `school`, `transit_station`/`bus_station`/`subway_station` y `supermarket`, dentro de un radio configurable (por defecto 1000 m).
- **Por qué**: reutiliza la misma cuenta de Google Cloud ya usada para Maps/Geocoding; no cachear en BD mantiene la implementación simple para un proyecto de prueba con bajo volumen de consultas.
- **Alternativa considerada**: cachear resultados por propiedad con expiración - se documenta como optimización futura si el volumen de consultas o el coste de la API lo justifican; no es necesaria ahora.
- Igual que con Geocoding, se usa la clave de servidor (`GOOGLE_MAPS_SERVER_API_KEY`, ampliando su restricción para incluir también Places API) - no se expone al cliente.

### 2. Histórico de precio: tabla dedicada `property_price_history`
Se añade una tabla `property_price_history` (`id`, `property_id` FK, `price`, `recorded_at`), poblada por el propio `PropertiesService` cada vez que detecta un cambio de precio en una edición.
- **Por qué**: un histórico append-only en su propia tabla es el modelo más simple y correcto para series temporales, y no interfiere con la tabla `properties` (que solo guarda el precio actual).

### 3. Zona = ciudad + código postal; agregación mensual del precio medio por m²
La "zona" para el cálculo de tendencia se define como la combinación (ciudad, código postal). El precio por m² de cada punto histórico se calcula como `precio / superficie` en el momento de ese registro, y se agregan en buckets mensuales (promedio) para la zona solicitada.
- **Por qué**: es la granularidad más simple que corresponde a los datos ya disponibles en el catálogo, sin depender de límites geográficos oficiales de barrio.
- Umbral mínimo de datos (Non-Goal evitar tendencias engañosas): se requiere un mínimo configurable de propiedades distintas con histórico en la zona (por defecto 3) antes de devolver una serie; si no se alcanza, se informa explícitamente de datos insuficientes (ver spec `price-trends`).

### 4. `city`/`postalCode` como columnas propias de `properties`, no derivadas de la dirección libre
Aunque `property-geolocation` ya maneja una "dirección" para geocodificar, esa dirección se trata como texto libre; para agrupar por zona de forma fiable se añaden `city` y `postalCode` como columnas estructuradas independientes, indicadas explícitamente al crear/editar la propiedad (no se intenta derivarlas automáticamente del resultado de geocodificación en este alcance).
- **Alternativa considerada**: parsear los componentes de dirección (`address_components`) que devuelve la Geocoding API de Google para autocompletar ciudad/código postal - buena mejora futura, pero añade complejidad de parsing y casos borde (formatos de dirección distintos); se deja fuera de este change para no acoplar `price-trends`/`nearby-services` a la fiabilidad del parseo automático.

## Risks / Trade-offs

- [Cuota/coste de Google Places API si el catálogo o el tráfico de fichas crece] → Mitigación: aceptado para un proyecto de prueba; cachear resultados por propiedad es la mitigación natural si el uso real lo justifica (ver Decisión 1).
- [Con pocos datos propios, la tendencia de precio por zona puede no ser representativa] → Mitigación: umbral mínimo configurable antes de mostrar la serie (Decisión 3), en vez de mostrar una gráfica poco fiable.
- [Ciudad/código postal como campos libres pueden introducir variantes de escritura que fragmenten "la misma zona" en la agregación (p. ej. "Madrid" vs "madrid ")] → Mitigación: normalizar (trim + minúsculas) al comparar/agrupar en la agregación, documentado como constraint de implementación.

## Open Questions

Ninguna que cambie specs, approach o tasks.
