## Why

Pisos.com integra en cada ficha un simulador de hipoteca y de gastos de compraventa, y Fotocasa ofrece una calculadora de rentabilidad de alquiler; ambas ayudan al usuario a entender de inmediato si una propiedad encaja en su presupuesto o si es una buena inversión, sin salir de la propia ficha. El catálogo actual solo muestra el precio, sin ningún apoyo para estimar el coste real de la operación ni su rentabilidad.

## What Changes

- Se añade un simulador de hipoteca en la ficha de cada propiedad: a partir del precio de la propiedad, una entrada inicial, un tipo de interés anual y un plazo en años, se calcula la cuota mensual estimada.
- Se añade una estimación de los gastos asociados a la compraventa (impuestos, notaría, registro, gestoría) como un desglose porcentual configurable sobre el precio, mostrando el total estimado junto a la cuota de hipoteca.
- Se añade, para propiedades en venta, un cálculo de rentabilidad de alquiler (bruta y neta) a partir del precio de venta y una renta mensual estimada.
- Todos los cálculos son autocontenidos (no dependen de una fuente de datos externa ni de información fiscal en tiempo real) y quedan explícitamente marcados como una estimación orientativa, no como asesoramiento financiero.

## Capabilities

### New Capabilities
- `mortgage-calculator`: cálculo de cuota de hipoteca estimada, gastos de compraventa estimados y rentabilidad de alquiler estimada, y su visualización como simulador interactivo en la ficha de una propiedad.

### Modified Capabilities
<!-- Ninguna: es una capability autocontenida que se apoya en el precio ya existente de property-catalog sin cambiar su comportamiento. -->

## Impact

- **Backend**: nuevo endpoint (o cálculo resuelto también en el propio frontend, a decidir en design.md) para la cuota de hipoteca, los gastos de compraventa y la rentabilidad de alquiler a partir de parámetros de entrada.
- **Frontend**: nuevo componente de simulador en la ficha de propiedad, prellenado con el precio de la propiedad, con controles para ajustar entrada/tipo de interés/plazo/renta estimada y ver el resultado actualizado.
- **Base de datos**: ninguna, son cálculos puros sin estado persistente.
