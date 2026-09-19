## 1. Backend

- [x] 1.1 Añadir `tour360` al enum `type` de `PropertyMedia` y su migración, y verificar que la migración se aplica correctamente sin afectar los medios existentes
- [x] 1.2 Extender el endpoint de subida de medios para aceptar `tour360` como tipo, reutilizando la validación de formato de imagen ya existente, y verificar con tests que se sube y se lista correctamente junto a fotos/videos

## 2. Frontend

- [x] 2.1 Integrar una librería de visor de panorama 360° (p. ej. Pannellum) y verificar manualmente que renderiza una imagen equirectangular de prueba con zoom y rotación
- [x] 2.2 Añadir la sección de tour(s) virtual(es) en la ficha de propiedad y la opción de subir un tour desde el componente de carga de medios, y verificar manualmente los casos con y sin tours

## 3. Verificación end-to-end

- [x] 3.1 Subir un tour virtual de prueba a una propiedad, consultar su ficha y verificar que el visor interactivo funciona (zoom/rotación) según los escenarios de `specs/property-media/spec.md`
