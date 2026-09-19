## Context

Extiende el MVP (`apps/api` NestJS, `apps/web` Next.js) con una capability autocontenida que no depende de otros changes incrementales propuestos (`advanced-search-filters`, `neighborhood-market-insights`) - puede implementarse en cualquier orden respecto a ellos. Ver proposal.md - Why/What Changes para la motivación.

## Goals / Non-Goals

**Goals:**
- Ofrecer un cálculo de cuota de hipoteca, de gastos de compraventa y de rentabilidad de alquiler correctos matemáticamente y fáciles de entender.
- Integrarlo como un simulador interactivo en la ficha de propiedad, prellenado con su precio.

**Non-Goals:**
- No se ofrece asesoramiento financiero real ni se contempla la variación de tipo de interés a lo largo del préstamo (hipoteca variable/mixta) - solo tipo fijo, para mantener el cálculo simple y claramente marcado como orientativo.
- No se calculan gastos fiscales exactos por comunidad autónoma o por tipo de operación (nueva vs segunda mano) - se usa un desglose porcentual configurable único, documentado como simplificación.
- La rentabilidad de alquiler usa una renta mensual estimada por el propio usuario (no se deriva automáticamente de precios de alquiler de mercado en la zona) - queda fuera de este alcance cruzar esto con `price-trends`.

## Decisions

### 1. Cálculo en el backend, expuesto como endpoint sin estado
Aunque es un cálculo puro que podría hacerse enteramente en el frontend, se expone también como endpoint de backend (`POST /api/v1/mortgage-calculator/quote` o similar) que recibe los parámetros y devuelve el resultado, sin persistir nada.
- **Por qué**: mantiene la fórmula de cálculo en un único lugar (evita duplicar la lógica de amortización en frontend y backend) y facilita testear la fórmula de forma aislada con Jest, igual que el resto del backend.
- **Alternativa considerada**: cálculo puramente en cliente (sin backend) - más simple de desplegar, pero duplicaría lógica financiera si en el futuro se necesita desde otro cliente (app móvil, etc.); se descarta a favor de una única fuente de verdad.

### 2. Fórmula de amortización francesa (cuota constante) estándar
La cuota mensual se calcula con la fórmula estándar de amortización de cuota constante: `cuota = P * r / (1 - (1 + r)^-n)`, donde `P` es el importe financiado, `r` el tipo de interés mensual (anual / 12) y `n` el número de cuotas (años * 12).
- **Por qué**: es el modelo de amortización estándar de una hipoteca fija a tipo constante, ampliamente conocido y verificable.

### 3. Gastos de compraventa: porcentajes configurables por variable de entorno, no por región
Se define un conjunto de porcentajes por defecto (configurable) para impuestos, notaría, registro y gestoría, aplicados como un único perfil (no diferenciado por comunidad autónoma).
- **Por qué**: modelar la fiscalidad real española por comunidad autónoma y tipo de operación es un alcance mucho mayor que el de un simulador orientativo de un proyecto de prueba; un perfil único configurable deja claro que es una aproximación y es fácil de ajustar sin tocar código.

### 4. Rentabilidad de alquiler: fórmula estándar bruta/neta con gastos anuales configurables
`rentabilidad bruta = (renta mensual * 12) / precio de venta * 100`. `rentabilidad neta = (renta mensual * 12 - gastos anuales estimados) / precio de venta * 100`, donde los gastos anuales estimados son un porcentaje configurable del precio (comunidad, IBI, seguro, mantenimiento agregados en un único porcentaje simplificado, igual que los gastos de compraventa).
- **Por qué**: son las fórmulas estándar de rentabilidad bruta/neta usadas en el sector, y reutilizan el mismo patrón de "porcentaje configurable" ya establecido para gastos de compraventa (Decisión 3), consistente en todo el simulador.
- **Alternativa considerada**: pedir al usuario el desglose exacto de gastos anuales en vez de un porcentaje agregado - más preciso pero añade fricción de UI para un simulador que ya se declara orientativo; se descarta en favor de la simplicidad.

## Risks / Trade-offs

- [Los porcentajes de gastos son una aproximación única, no reflejan diferencias reales entre comunidades autónomas] → Mitigación: se muestra explícitamente como estimación orientativa (requisito de la spec), y los porcentajes son configurables si se quiere ajustar por caso de uso.
- [Un usuario podría interpretar la cuota estimada como una oferta real de financiación] → Mitigación: el requisito de "Los importes son orientativos" exige un aviso explícito en la UI junto al resultado.
- [La rentabilidad depende de una renta mensual estimada a mano por el usuario, no de datos de mercado] → Mitigación: aceptado como Non-Goal explícito; cruzar con datos reales de alquiler de la zona es una mejora futura si se conecta con `price-trends`.

## Open Questions

Ninguna que cambie specs, approach o tasks.
