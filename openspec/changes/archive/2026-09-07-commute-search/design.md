## Context

Extiende el listado de `property-catalog`/`property-geolocation` con un filtro adicional. No depende de otros changes propuestos, aunque puede combinarse con el filtro de área de `advanced-search-filters` si ya está implementado. Ver proposal.md - Why/What Changes.

## Goals / Non-Goals

**Goals:**
- Filtrar por tiempo de trayecto real (no distancia en línea recta) usando un servicio de rutas real.

**Non-Goals:**
- No se calcula tráfico en tiempo real ni horarios de transporte público específicos - se usa la estimación estándar del servicio de rutas para el medio de transporte elegido.

## Decisions

### 1. Google Distance Matrix API, con límite de candidatas por lote
Para no consultar la API por cada propiedad del catálogo individualmente, primero se acota el conjunto de candidatas con un filtro barato (p. ej. una caja delimitadora amplia alrededor del destino, usando el tiempo máximo convertido a un radio conservador según el medio de transporte), y solo esas candidatas (en lotes, respetando el límite de destinos por request de la API) se consultan contra la Distance Matrix API.
- **Por qué**: la Distance Matrix API cobra y limita por número de orígenes x destinos por request; sin este pre-filtro, cada búsqueda podría disparar muchas llamadas innecesarias sobre propiedades obviamente fuera de rango.
- **Alternativa considerada**: consultar todas las propiedades geolocalizadas sin pre-filtro - simple pero no escala en coste/cuota; se descarta.

### 2. Reutiliza la clave de servidor de Google ya existente, ampliando su restricción a Distance Matrix API
Igual que con Geocoding y Places, se usa `GOOGLE_MAPS_SERVER_API_KEY` (backend), sin exponer la clave al cliente.

## Risks / Trade-offs

- [Coste/cuota de Distance Matrix API si el catálogo crece mucho] → Mitigación: pre-filtro por caja delimitadora (Decisión 1); aceptado para el volumen de un proyecto de prueba.
- [El radio conservador del pre-filtro podría excluir por error alguna propiedad límite en zonas con tráfico atípico] → Mitigación: aceptado como aproximación razonable; documentado como simplificación.

## Open Questions

Ninguna que cambie specs, approach o tasks.
