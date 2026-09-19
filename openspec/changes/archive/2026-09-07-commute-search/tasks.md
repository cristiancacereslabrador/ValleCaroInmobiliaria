## 1. Backend - integración con Distance Matrix

- [x] 1.1 Implementar el cliente de la Distance Matrix API (origen(es), destino, medio de transporte) y verificar con un test (mockeando la llamada HTTP) que interpreta correctamente la respuesta de tiempo de trayecto
- [x] 1.2 Implementar el pre-filtro por caja delimitadora alrededor del destino según el tiempo máximo y el medio de transporte, y verificar con tests unitarios que acota candidatas razonablemente

## 2. Backend - endpoint de búsqueda por trayecto

- [x] 2.1 Extender el endpoint de listado para aceptar destino, medio de transporte y tiempo máximo, combinando el pre-filtro y la consulta a Distance Matrix, y verificar con tests los escenarios de `specs/commute-search/spec.md` (parámetros válidos, destino no resoluble, sin resultados)
- [x] 2.2 Implementar el manejo de error cuando el servicio de trayectos no está disponible, y verificar con tests que el resto de filtros del catálogo siguen funcionando

## 3. Frontend

- [x] 3.1 Añadir el control de búsqueda por trayecto (dirección de destino, medio de transporte, tiempo máximo) en la página de listado, y verificar manualmente que aplica el filtro y muestra el estado de error si el servicio no está disponible

## 4. Verificación end-to-end

- [x] 4.1 Crear propiedades geolocalizadas a distintas distancias de un destino de prueba, buscar por trayecto con distintos tiempos máximos y medios de transporte, y verificar que los resultados coinciden con lo esperado según los escenarios de la spec
