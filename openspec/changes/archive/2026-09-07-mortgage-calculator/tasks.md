## 1. Backend - cálculo de hipoteca

- [x] 1.1 Implementar la función pura de cálculo de cuota mensual (amortización de cuota constante) y verificar con tests unitarios varios casos conocidos (incluyendo entrada = precio y plazo/tipo inválidos)
- [x] 1.2 Exponer el endpoint de cálculo de cuota de hipoteca y verificar con tests los escenarios de `specs/mortgage-calculator/spec.md` referidos a la cuota (parámetros válidos, entrada >= precio, parámetros fuera de rango)

## 2. Backend - cálculo de gastos de compraventa

- [x] 2.1 Implementar el cálculo de gastos de compraventa a partir de porcentajes configurables (impuestos, notaría, registro, gestoría) y verificar con tests unitarios el desglose y el total para un precio de ejemplo
- [x] 2.2 Exponer el endpoint de cálculo de gastos (puede combinarse con el de cuota en una sola respuesta) y verificar con tests que incluye el aviso de estimación orientativa en la respuesta o que el contrato deja claro que es una estimación

## 3. Backend - cálculo de rentabilidad de alquiler

- [x] 3.1 Implementar la función pura de cálculo de rentabilidad bruta y neta anual (renta mensual, precio de venta, gastos anuales estimados configurables) y verificar con tests unitarios varios casos conocidos, incluyendo datos inválidos (precio o renta <= 0)
- [x] 3.2 Exponer el cálculo de rentabilidad en el endpoint del simulador (solo aplicable a propiedades en venta) y verificar con tests que una propiedad en alquiler informa que el cálculo no aplica, sin error inesperado

## 4. Frontend - simulador en la ficha de propiedad

- [x] 4.1 Implementar el componente de simulador (entrada, tipo de interés, plazo) prellenado con el precio de la propiedad, y verificar manualmente que carga con valores por defecto razonables
- [x] 4.2 Conectar el simulador con el cálculo (backend o cliente según quede resuelto en implementación) para que se actualice interactivamente al cambiar los parámetros, y verificar manualmente que el resultado cambia sin recargar la página
- [x] 4.3 Mostrar el desglose de gastos de compraventa junto al resultado de la cuota, incluyendo el aviso de estimación orientativa, y verificar manualmente que se muestra correctamente
- [x] 4.4 Añadir la sección de rentabilidad de alquiler (visible solo en propiedades en venta) con campo de renta mensual estimada, y verificar manualmente que muestra la rentabilidad bruta y neta actualizándose de forma interactiva

## 5. Verificación end-to-end

- [x] 5.1 Ejecutar el flujo completo (abrir la ficha de una propiedad en venta con precio conocido, ajustar los parámetros del simulador de hipoteca y de rentabilidad, y comprobar que los resultados calculados coinciden con el cálculo manual esperado) contra el entorno local levantado con Docker Compose, y verificar que se comporta según los escenarios de `specs/mortgage-calculator/spec.md`
