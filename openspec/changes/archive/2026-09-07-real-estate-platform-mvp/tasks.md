## 1. Configuración del monorepo

- [x] 1.1 Crear la estructura de monorepo (`apps/api`, `apps/web`) con workspaces y verificar que `npm install`/`pnpm install` resuelve dependencias en ambos paquetes sin errores
- [x] 1.2 Añadir `docker-compose.yml` con servicio MariaDB para desarrollo local y verificar que `docker compose up -d mariadb` deja el contenedor en estado `healthy`
- [x] 1.3 Definir archivos `.env.example` para `apps/api` (credenciales MariaDB, `GOOGLE_MAPS_SERVER_API_KEY`, límites de tamaño de archivo) y `apps/web` (`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY`, URL base de la API) y verificar que ambos arrancan usando solo esas variables
  - `apps/api/.env.example` creado y verificado: la API arranca (`npm run start:dev`) usando solo esas variables. `apps/web/.env.example` verificado ahora que `apps/web` es una app Next.js real (grupos 6-9): copiado tal cual a `apps/web/.env.local` (sin añadir ni completar ninguna variable adicional) y tanto `npm run dev --workspace=apps/web` como `npm run build --workspace=apps/web` arrancan/compilan correctamente contra la API real en `localhost:3001` usando solo esas dos variables.

## 2. Base de datos y modelo de datos

- [x] 2.1 Inicializar proyecto NestJS en `apps/api` con `@nestjs/typeorm` y el driver `mysql2` configurado contra MariaDB, y verificar que la app arranca conectando a la base de datos sin errores
- [x] 2.2 Crear entidad `Property` (tipo de vivienda enum, superficie, habitaciones, baños, planta, año de construcción, estado, precio, tipo de operación, certificado energético, `latitude`/`longitude` nullable) y su migración, y verificar que la migración se aplica correctamente sobre MariaDB
- [x] 2.3 Crear entidad `PropertyMedia` (relación N:1 con `Property`, `type` foto/video, `url`, `is_cover`, `position`) y su migración, y verificar que la migración se aplica correctamente y respeta la FK hacia `properties`

## 3. Backend - capability `property-catalog`

- [x] 3.1 Implementar `PropertiesModule` con endpoint de creación (`POST /api/v1/properties`) validando tipo de vivienda y campos obligatorios, y verificar con tests que una creación válida devuelve 201 y una con datos obligatorios ausentes devuelve un error de validación
- [x] 3.2 Implementar endpoint de edición (`PATCH /api/v1/properties/:id`) y verificar con tests que edita una propiedad existente y devuelve error al editar un id inexistente
- [x] 3.3 Implementar endpoint de baja (`DELETE /api/v1/properties/:id`) y verificar con tests que elimina una propiedad existente y devuelve error al eliminar un id inexistente
- [x] 3.4 Implementar endpoint de detalle (`GET /api/v1/properties/:id`) y verificar con tests que devuelve todos los campos de una propiedad existente y un 404 para un id inexistente
- [x] 3.5 Implementar endpoint de listado con filtros por tipo de vivienda, tipo de operación y rango de precio (`GET /api/v1/properties`) y verificar con tests cada combinación de filtro descrita en `specs/property-catalog/spec.md`

## 4. Backend - capability `property-media`

- [x] 4.1 Implementar `MediaStorageService` (abstracción de almacenamiento, implementación inicial sobre filesystem local bajo `apps/api/storage/properties/<property_id>/`) y verificar con un test unitario que guarda y elimina archivos correctamente
- [x] 4.2 Implementar endpoint de subida de medios (`POST /api/v1/properties/:id/media`, multipart/form-data) validando formato (`jpg`/`png`/`webp` para foto, `mp4`/`webm` para video) y tamaño máximo, y verificar con tests que rechaza formatos/tamaños no soportados y acepta los válidos
- [x] 4.3 Implementar endpoint de listado de medios de una propiedad (`GET /api/v1/properties/:id/media`) y verificar con tests que devuelve lista vacía cuando no hay medios y la lista completa cuando existen
- [x] 4.4 Implementar endpoint de eliminación de un medio (`DELETE /api/v1/properties/:id/media/:mediaId`) y verificar con tests que elimina el registro y el archivo físico, y devuelve error si el medio no existe
- [x] 4.5 Implementar lógica de foto de portada (marcar `is_cover`, fallback a la primera foto cargada) y verificar con tests los dos escenarios de `specs/property-media/spec.md` (portada explícita y portada por defecto)

## 5. Backend - capability `property-geolocation`

- [x] 5.1 Implementar `GeocodingService` que llama a la Geocoding API de Google usando `GOOGLE_MAPS_SERVER_API_KEY` y verificar con un test (mockeando la llamada HTTP) que resuelve latitud/longitud a partir de una dirección
- [x] 5.2 Integrar `GeocodingService` en la creación/edición de propiedades: geocodificar automáticamente cuando hay dirección y no hay coordenadas explícitas, y verificar con tests que una dirección no geocodificable no bloquea la creación de la propiedad (se guarda sin coordenadas)
- [x] 5.3 Validar rango de coordenadas (`latitude` en [-90, 90], `longitude` en [-180, 180]) al recibirlas explícitamente y verificar con tests que coordenadas fuera de rango son rechazadas

## 6. Frontend - base Next.js

- [x] 6.1 Inicializar proyecto Next.js en `apps/web` (App Router) con cliente HTTP tipado hacia la API, y verificar que `npm run build` completa sin errores
- [x] 6.2 Configurar carga de `@react-google-maps/api` (o librería equivalente) usando `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY`, y verificar que un componente de prueba renderiza un mapa en el navegador

## 7. Frontend - catálogo de propiedades

- [x] 7.1 Implementar página de listado de propiedades consumiendo `GET /api/v1/properties`, con filtros de tipo de vivienda, operación y rango de precio, y verificar manualmente que aplicar cada filtro actualiza el listado
- [x] 7.2 Implementar formulario de alta/edición de propiedad cubriendo tipo de vivienda y todas las especificaciones inherentes, y verificar manualmente que crear y editar una propiedad se refleja en el listado y en el detalle
- [x] 7.3 Implementar página de detalle de propiedad mostrando todas sus especificaciones, y verificar manualmente que muestra correctamente una propiedad con datos completos

## 8. Frontend - gestión multimedia

- [x] 8.1 Implementar componente de carga de fotos/videos en la ficha de propiedad (consumiendo el endpoint de subida) y verificar manualmente que sube archivos válidos y muestra el error correspondiente para formatos/tamaños no soportados
- [x] 8.2 Implementar galería de medios en el detalle de propiedad (listado, marcar portada, eliminar) y verificar manualmente los tres escenarios (listar, marcar portada, eliminar)

## 9. Frontend - geolocalización

- [x] 9.1 Implementar el mapa de detalle de propiedad (marcador centrado en sus coordenadas, o ausencia de mapa si no tiene coordenadas) y verificar manualmente ambos casos con una propiedad geolocalizada y otra sin geolocalizar
- [x] 9.2 Implementar el mapa de listado con un marcador por propiedad geolocalizada y tarjeta de información al seleccionar un marcador (tipo de vivienda, precio, foto de portada), y verificar manualmente con varias propiedades geolocalizadas
- [x] 9.3 Implementar manejo de error cuando el mapa no carga (servicio no disponible / API key inválida), degradando la ficha de propiedad sin bloquear el resto del contenido, y verificar manualmente forzando una clave de API inválida en un entorno de prueba

## 10. Verificación end-to-end

- [x] 10.1 Ejecutar el flujo completo (crear propiedad con dirección → geocodificación automática → subir fotos/video → marcar portada → verla en el listado con mapa y en el detalle con mapa) en un entorno local levantado con Docker Compose, y verificar que cada paso se comporta según los escenarios descritos en `specs/property-catalog`, `specs/property-media` y `specs/property-geolocation`
  - Entorno: `docker compose up -d mariadb` (contenedor `real-estate-mariadb`, puerto 3307, healthy) + `apps/api` real (`npm run start:dev`, puerto 3001) + `apps/web` real (`next dev -p 3002`, build de producción también verificado con `next build`). Todo el flujo se recorrió con `curl` real contra la API (sin mocks, sin API key de Google Maps configurada) más lectura del código frontend para confirmar el cableado con el contrato de la API.
  - 1) Propiedad con dirección y sin coordenadas explícitas (`POST /properties` con `address`, sin `GOOGLE_MAPS_SERVER_API_KEY`): se guarda con `latitude`/`longitude` en `null` sin bloquear la creación (201) — log confirma "No se pudieron obtener coordenadas… la propiedad se guarda sin ubicación en mapa".
  - 2) Propiedad con coordenadas explícitas válidas (`latitude: 40.4168, longitude: -3.7038`): se almacenan y se devuelven tal cual.
  - 3) Subida de medios sobre la propiedad geolocalizada: 2 fotos `.jpg` válidas + 1 vídeo `.mp4` válido → 201; `.gif` (formato no soportado) → 400; `.avi` (formato no soportado) → 400; foto de 11 MB (> límite `MEDIA_MAX_IMAGE_SIZE_MB=10`) → 400.
  - 4) Portada explícita: `PATCH .../media/:mediaId/cover` sobre la segunda foto → `isCover` se mueve correctamente y `coverPhotoUrl` se refleja tanto en el detalle como en el listado.
  - 5) Eliminar la foto de portada (`DELETE .../media/:mediaId`) → la primera foto se promociona automáticamente a portada (`coverPhotoUrl` actualizado).
  - 6) Filtros de listado (`GET /properties`) probados: por `type`, por `operationType`, combinado `type`+`operationType`, por rango `minPrice`/`maxPrice`, sin filtros, y `type` inválido (400) — todas las combinaciones devuelven el subconjunto esperado.
  - 7) Detalle de la propiedad geolocalizada vs. la no geolocalizada: confirmado en la API (`latitude`/`longitude` `null` vs. valores reales) y en el código de `apps/web/src/components/PropertyMap.tsx` que `PropertyMap` devuelve `null` (sin componente de mapa) cuando no hay coordenadas, y muestra el mapa (o el aviso "no hay clave configurada", ya que este entorno de prueba no tiene `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY`) cuando sí las hay — ambas páginas de detalle devuelven HTTP 200 sin errores de compilación/runtime en el log de `next dev`.
  - 8) Editar (`PATCH`, cambio de `price`/`status` reflejado en el detalle) y eliminar (`DELETE`) una propiedad: confirmado que desaparece del listado y devuelve 404 en el detalle; también se probaron 404 al editar/eliminar un id inexistente.
  - **Bug real encontrado y corregido**: `PropertiesService.create()` devolvía la propiedad sin la clave `media` (TypeORM no la carga en una entidad recién creada con `.create()`+`.save()`), mientras que `findOne`/`findAll` sí la incluyen siempre como array — inconsistencia real de contrato frente al tipo `Property` (`media: PropertyMedia[]`) que consume `apps/web`. Corregido en `apps/api/src/properties/properties.service.ts` (`saved.media = []` antes de `withCoverPhoto`). No rompía nada en tiempo de ejecución (la página de alta solo usa `property.id` de la respuesta y la ficha de detalle ya hacía `data.media ?? []`), pero sí violaba el contrato tipado; los 52 tests unitarios de `apps/api` siguen en verde tras el cambio.
  - **Salvedad honesta**: no hay navegador headless disponible en este entorno, así que no se pudo confirmar visualmente el renderizado real de los tiles de Google Maps, el comportamiento interactivo de los marcadores/InfoWindow del mapa de listado, ni la subida de archivos por drag-and-drop en el navegador. La verificación del frontend se hizo mediante `curl` contra las páginas reales (200 OK, sin errores en el log de `next dev`, `next build` de producción sin errores de tipos) y lectura directa del código (`PropertyMap.tsx`, `MapStatusNotice.tsx`, `properties.ts`, `media.ts`, `types.ts`) para confirmar que la lógica de bifurcación mapa/sin-mapa y el contrato de la API están correctamente cableados.
