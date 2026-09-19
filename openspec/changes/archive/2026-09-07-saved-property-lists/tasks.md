## 1. Backend - modelo de datos

- [x] 1.1 Crear las entidades y migración de `SavedPropertyList` (nombre, `managementToken`, `shareToken`) y `SavedPropertyListItem` (lista, propiedad, constraint único lista+propiedad), y verificar que la migración se aplica correctamente

## 2. Backend - endpoints

- [x] 2.1 Implementar la creación de lista y verificar con tests que devuelve ambos tokens distintos
- [x] 2.2 Implementar añadir/quitar propiedades vía `managementToken`, y verificar con tests los escenarios de `specs/saved-property-lists/spec.md` (añadir, añadir duplicado, quitar, token inválido)
- [x] 2.3 Implementar la consulta en modo gestión (`managementToken`) y en modo solo lectura (`shareToken`, sin exponer el token de gestión), y verificar con tests que el modo solo lectura rechaza intentos de modificación

## 3. Frontend

- [x] 3.1 Añadir el botón "guardar en lista" desde el listado/ficha de propiedad (crear lista nueva o añadir a una existente guardada en el navegador), y verificar manualmente el flujo completo
- [x] 3.2 Implementar la página de gestión de una lista (usando el `managementToken` guardado en `localStorage`) y la página pública de solo lectura (`shareToken`), y verificar manualmente ambas vistas

## 4. Verificación end-to-end

- [x] 4.1 Crear una lista, añadir y quitar propiedades, consultarla en modo gestión y compartir su enlace de solo lectura verificando que ese acceso no permite modificarla, según los escenarios de la spec
