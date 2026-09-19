## 1. Backend

- [x] 1.1 Implementar la consulta de propiedades similares (mismo tipo/operación, rango de superficie ±20%, habitaciones ±1, excluyendo la propia), y verificar con tests unitarios los escenarios de `specs/similar-properties/spec.md` (con resultados, sin resultados)
- [x] 1.2 Añadir el ordenamiento por cercanía geográfica cuando ambas propiedades tienen coordenadas, y verificar con tests que prioriza las más cercanas
- [x] 1.3 Exponer el endpoint (`GET /api/v1/properties/:id/similar`) limitado a un máximo configurable de resultados, y verificar con tests de integración

## 2. Frontend

- [x] 2.1 Implementar la sección de "propiedades similares" en la ficha de detalle (tarjetas con portada/precio/tipo, navegables), y verificar manualmente los casos con y sin resultados

## 3. Verificación end-to-end

- [x] 3.1 Crear varias propiedades con distintos grados de similitud entre sí, consultar el endpoint/ficha de una de ellas y verificar que el orden y el contenido devuelto coinciden con los escenarios de la spec
