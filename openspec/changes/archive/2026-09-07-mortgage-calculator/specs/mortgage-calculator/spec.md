## Purpose

Permite estimar, directamente desde la ficha de una propiedad, la cuota mensual de una hipoteca y los gastos asociados a su compraventa, como una ayuda orientativa para valorar el coste real de la operación.

## ADDED Requirements

### Requirement: Cálculo de cuota de hipoteca estimada
Dado el precio de una propiedad, una entrada (importe o porcentaje), un tipo de interés anual y un plazo en años, el sistema SHALL calcular la cuota mensual estimada de una hipoteca de amortización constante para el importe financiado resultante.

#### Scenario: Cálculo con parámetros válidos
- **WHEN** se solicita el cálculo de cuota indicando precio, entrada, tipo de interés anual y plazo en años, todos ellos válidos
- **THEN** el sistema devuelve la cuota mensual estimada correspondiente al importe financiado (precio menos entrada) a ese tipo de interés y plazo

#### Scenario: Entrada igual o mayor que el precio
- **WHEN** se solicita el cálculo indicando una entrada igual o mayor que el precio de la propiedad
- **THEN** el sistema rechaza el cálculo e informa de que no hay importe que financiar, o informa de una cuota de 0 según corresponda a una hipoteca innecesaria, sin lanzar un error inesperado

#### Scenario: Parámetros fuera de rango
- **WHEN** se solicita el cálculo indicando un plazo menor o igual a 0, o un tipo de interés negativo
- **THEN** el sistema rechaza el cálculo e informa que los parámetros indicados no son válidos

### Requirement: Cálculo de gastos estimados de compraventa
Dado el precio de una propiedad, el sistema SHALL estimar los gastos asociados a su compraventa (impuestos, notaría, registro y gestoría) como un desglose basado en porcentajes configurables sobre el precio, junto con el total estimado.

#### Scenario: Cálculo de gastos con precio válido
- **WHEN** se solicita el cálculo de gastos de compraventa para una propiedad con un precio válido
- **THEN** el sistema devuelve el desglose de cada concepto estimado y su suma total

#### Scenario: Los importes son orientativos, no asesoramiento fiscal
- **WHEN** se muestra el resultado del cálculo de gastos de compraventa
- **THEN** el sistema indica explícitamente que se trata de una estimación orientativa y no de un cálculo fiscal exacto ni de asesoramiento financiero

### Requirement: Cálculo de rentabilidad de alquiler
Dado el precio de venta de una propiedad y una renta mensual de alquiler estimada o indicada por el usuario, el sistema SHALL calcular la rentabilidad bruta anual (renta anual entre precio de venta) y la rentabilidad neta anual descontando unos gastos anuales estimados configurables (comunidad, IBI, seguro, mantenimiento).

#### Scenario: Cálculo de rentabilidad con datos válidos
- **WHEN** se solicita el cálculo de rentabilidad indicando el precio de venta y la renta mensual de alquiler, ambos válidos
- **THEN** el sistema devuelve la rentabilidad bruta anual y la rentabilidad neta anual estimadas, expresadas en porcentaje

#### Scenario: Datos de rentabilidad inválidos
- **WHEN** se solicita el cálculo de rentabilidad indicando un precio de venta o una renta mensual menores o iguales a cero
- **THEN** el sistema rechaza el cálculo e informa que los datos indicados no son válidos

#### Scenario: Rentabilidad disponible solo para propiedades en venta
- **WHEN** se solicita el cálculo de rentabilidad para una propiedad cuyo tipo de operación es alquiler (no venta)
- **THEN** el sistema informa de que el cálculo de rentabilidad no aplica a esa propiedad, sin lanzar un error inesperado

### Requirement: Simulador en la ficha de propiedad
El sistema SHALL mostrar, en la ficha de detalle de una propiedad, un simulador interactivo prellenado con el precio de esa propiedad, que recalcula la cuota de hipoteca, los gastos de compraventa y, cuando aplique, la rentabilidad de alquiler, al modificar los parámetros de entrada.

#### Scenario: Simulador prellenado con el precio de la propiedad
- **WHEN** se consulta el detalle de una propiedad
- **THEN** el simulador se muestra con el precio de esa propiedad ya cargado y unos valores por defecto razonables de entrada, tipo de interés y plazo

#### Scenario: Actualización interactiva del resultado
- **WHEN** el usuario modifica la entrada, el tipo de interés o el plazo en el simulador
- **THEN** la cuota de hipoteca y los gastos de compraventa mostrados se actualizan de acuerdo con los nuevos valores, sin necesidad de recargar la página

#### Scenario: Sección de rentabilidad visible en propiedades en venta
- **WHEN** se consulta el detalle de una propiedad cuyo tipo de operación es venta
- **THEN** el simulador incluye también la sección de cálculo de rentabilidad de alquiler, permitiendo indicar una renta mensual estimada
