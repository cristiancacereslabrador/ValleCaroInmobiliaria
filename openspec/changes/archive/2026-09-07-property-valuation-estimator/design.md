## Context

Se beneficia de que `advanced-search-filters` y `neighborhood-market-insights` ya estén implementados (ciudad/código postal, histórico de precio), pero no los requiere estrictamente: sin ellos, la "zona" se aproxima con los campos disponibles en `property-catalog` en ese momento (ver Decisión 2). Ver proposal.md - Why/What Changes.

## Goals / Non-Goals

**Goals:**
- Estimar un rango de precio razonable a partir de comparables reales del propio catálogo, sin inventar datos.

**Non-Goals:**
- No es una tasación pericial ni usa modelos de valoración inmobiliaria certificados - es una aproximación estadística simple sobre datos propios, declarada como tal en todo momento.

## Decisions

### 1. Rango de precio = percentiles 25-75 del precio/m² de los comparables, aplicado a la superficie indicada
Se seleccionan comparables (mismo tipo, zona, superficie ±25%, habitaciones ±1) con operación venta (y por separado, alquiler), se calcula su precio/m², se toman los percentiles 25 y 75 de esa distribución, y se multiplican por la superficie del inmueble a tasar para obtener el rango.
- **Por qué**: es un método simple, transparente y defendible con pocos datos, sin necesitar un modelo de regresión.
- **Alternativa considerada**: regresión lineal sobre las características - más sofisticado pero requiere más datos para ser fiable y es más difícil de explicar como "orientativo"; se descarta para este alcance.

### 2. Zona: usa ciudad/código postal si existen, si no cae a lo que haya en property-catalog
Si `neighborhood-market-insights` ya está implementado (existen `city`/`postalCode` en `Property`), se usan como criterio de zona. Si no, la implementación de este change debe añadir esos mismos dos campos (ya que son imprescindibles para poder buscar comparables por zona) - en ese caso, este change los introduce como MODIFIED de `property-catalog` en vez de asumir que ya existen.
- **Por qué**: la funcionalidad no puede funcionar sin un concepto de zona; se evita bloquear este change a que otro se implemente antes, a costa de que ambos puedan definir el mismo campo (el agente que implemente debe comprobar primero si `city`/`postalCode` ya existen en la entidad antes de intentar añadirlos de nuevo).

### 3. Umbral mínimo de comparables configurable (por defecto 3), igual que en `price-trends`
Reutiliza el mismo criterio ya establecido en `neighborhood-market-insights` para evitar estimaciones poco fiables con pocos datos.

## Risks / Trade-offs

- [Con un catálogo pequeño, muchas combinaciones tipo/zona no tendrán comparables suficientes] → Mitigación: la spec exige indicar explícitamente "datos insuficientes" en vez de forzar un resultado.

## Open Questions

Ninguna que cambie specs, approach o tasks.
