## 1. Backend - modelo de datos

- [x] 1.1 Añadir columnas `hasElevator`, `needsRenovation`, `isBankOwned` (booleanas, nullable) a la entidad `Property` y su migración, y verificar que la migración se aplica correctamente sobre MariaDB sin afectar datos existentes
- [x] 1.2 Actualizar los DTOs de creación/edición de propiedad para aceptar los nuevos atributos como opcionales, y verificar con tests que se pueden omitir sin rechazar la petición (quedan como no indicados)

## 2. Backend - filtros nuevos en el listado

- [x] 2.1 Extender el endpoint de listado (`GET /api/v1/properties`) para aceptar filtros por ascensor, planta baja, necesidad de reforma y procedencia bancaria, y verificar con tests cada filtro por separado según `specs/property-catalog/spec.md`
- [x] 2.2 Verificar con tests la combinación de los nuevos filtros junto con los filtros existentes (tipo, operación, precio) en una misma petición

## 3. Backend - búsqueda por área geográfica

- [x] 3.1 Implementar la utilidad de comprobación punto-en-polígono (ray-casting) como función pura y verificar con tests unitarios casos dentro/fuera/en el borde del polígono
- [x] 3.2 Extender el endpoint de listado para aceptar un polígono (array de vértices lat/lng) y devolver solo propiedades geolocalizadas dentro de él, y verificar con tests los escenarios de `specs/property-geolocation/spec.md` (área válida, área vacía, polígono inválido)
- [x] 3.3 Verificar con tests que la búsqueda por área se puede combinar con el resto de filtros del catálogo

## 4. Frontend - controles de filtro nuevos

- [x] 4.1 Añadir a la página de listado los controles de filtro para ascensor, planta baja, necesidad de reforma y procedencia bancaria (con estado "sin especificar" distinguible de "no"), y verificar manualmente que cada filtro actualiza el listado
- [x] 4.2 Añadir los nuevos campos (ascensor, necesita reforma, procedencia bancaria) al formulario de alta/edición de propiedad, y verificar manualmente que se guardan y se reflejan en el detalle

## 5. Frontend - dibujo de área en el mapa

- [x] 5.1 Integrar la Drawing Library de Google Maps en el mapa de listado (herramienta de dibujo de polígono), y verificar manualmente que se puede dibujar un polígono sobre el mapa
- [x] 5.2 Conectar el polígono dibujado con la petición de listado al backend, y verificar manualmente que al dibujar un área el listado se filtra a las propiedades dentro de ella
- [x] 5.3 Añadir opción de limpiar/rehacer el área dibujada, y verificar manualmente que al limpiarla el listado vuelve a mostrar los resultados sin el filtro de área

## 6. Verificación end-to-end

- [x] 6.1 Ejecutar el flujo completo (crear propiedades con distintos valores de ascensor/reforma/procedencia bancaria y distintas ubicaciones → aplicar filtros nuevos → dibujar un área en el mapa → combinar área con filtros) contra el entorno local levantado con Docker Compose, y verificar que cada paso se comporta según los escenarios de `specs/property-catalog/spec.md` y `specs/property-geolocation/spec.md`
