## Context

Capability autocontenida de solo lectura sobre `property-catalog`. No depende de otros changes propuestos. Ver proposal.md - Why/What Changes.

## Goals / Non-Goals

**Goals:**
- Devolver candidatas relevantes con una consulta SQL simple, sin motor de recomendación.

**Non-Goals:**
- No se usa machine learning ni historial de comportamiento del usuario - solo similitud por atributos propios de la propiedad, como hacen los portales de referencia en su versión más básica.

## Decisions

### 1. Cálculo en SQL con filtro de rango, orden por distancia en memoria
La consulta filtra por `type`, `operationType`, rango de `surface` (±20%) y `rooms` (±1) directamente en SQL (`WHERE`), limita a un múltiplo del máximo deseado (p. ej. 30 candidatas) y, si hay coordenadas, ordena el resultado final por distancia en memoria (reutilizando la fórmula ya usada en `advanced-search-filters`/`property-geolocation` si ya existe, o Haversine simple si no).
- **Por qué**: evita funciones geoespaciales SQL para un volumen de datos de prueba, consistente con decisiones ya tomadas en `advanced-search-filters`.

## Risks / Trade-offs

- [Con un catálogo pequeño, "similar" puede devolver pocos o ningún resultado] → Mitigación: aceptado, la spec contempla explícitamente el caso de lista vacía.

## Open Questions

Ninguna que cambie specs, approach o tasks.
