## 1. Backend - modelo de datos

- [x] 1.1 Añadir columnas `city` y `postalCode` (nullable) a la entidad `Property` y su migración, y verificar que la migración se aplica correctamente sin afectar datos existentes
- [x] 1.2 Actualizar los DTOs de creación/edición para aceptar `city`/`postalCode` como opcionales, y verificar con tests que se pueden omitir sin rechazar la petición
- [x] 1.3 Crear la entidad y migración de `property_price_history` (`property_id` FK, `price`, `recorded_at`), y verificar que la migración se aplica correctamente y respeta la FK hacia `properties`

## 2. Backend - histórico de precio

- [x] 2.1 Modificar `PropertiesService` para registrar un nuevo punto en `property_price_history` cuando una edición cambia el precio, y verificar con tests que editar sin cambiar el precio no añade registros y editar cambiándolo sí
- [x] 2.2 Exponer el histórico de precio de una propiedad (endpoint o incluido en el detalle) y verificar con tests que devuelve los registros en orden cronológico

## 3. Backend - entorno (`nearby-services`)

- [x] 3.1 Implementar `NearbyServicesService` que llama a la Nearby Search de Google Places para las categorías colegio/transporte/supermercado dentro de un radio configurable, y verificar con un test (mockeando la llamada HTTP) que agrupa correctamente los resultados por categoría con su distancia
- [x] 3.2 Exponer el entorno de una propiedad (`GET /api/v1/properties/:id/nearby-services` o equivalente) y verificar con tests los escenarios de `specs/nearby-services/spec.md` (con resultados, sin resultados, sin coordenadas, servicio no disponible)

## 4. Backend - evolución de precio por zona (`price-trends`)

- [x] 4.1 Implementar el cálculo de precio por m² por punto histórico y su agregación mensual por zona (ciudad + código postal, normalizados), y verificar con tests unitarios el cálculo de la serie con datos de ejemplo
- [x] 4.2 Implementar el umbral mínimo de propiedades distintas con histórico antes de devolver una serie, y verificar con tests que por debajo del umbral se informa de datos insuficientes en vez de devolver una serie
- [x] 4.3 Exponer el endpoint de evolución de precio por zona y verificar con tests los escenarios de `specs/price-trends/spec.md`

## 5. Frontend - ciudad/código postal en el formulario

- [x] 5.1 Añadir los campos ciudad y código postal al formulario de alta/edición de propiedad, y verificar manualmente que se guardan y se reflejan en el detalle

## 6. Frontend - sección de entorno en la ficha

- [x] 6.1 Implementar la sección de entorno en la ficha de propiedad (puntos de interés agrupados por categoría con distancia), y verificar manualmente los casos con entorno disponible y sin él (propiedad sin coordenadas o servicio no disponible)

## 7. Frontend - gráfico de evolución de precio de zona

- [x] 7.1 Implementar el gráfico de evolución de precio medio por m² de la zona en la ficha de propiedad, y verificar manualmente los casos con datos suficientes y con datos insuficientes

## 8. Verificación end-to-end

- [x] 8.1 Ejecutar el flujo completo (crear varias propiedades en la misma zona con ciudad/código postal, editar precios para generar histórico, consultar entorno y evolución de precio de una de ellas) contra el entorno local levantado con Docker Compose, y verificar que cada paso se comporta según los escenarios de `specs/property-catalog/spec.md`, `specs/nearby-services/spec.md` y `specs/price-trends/spec.md`
