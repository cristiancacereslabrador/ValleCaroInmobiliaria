## Context

Proyecto nuevo desde cero (no existe código previo en este repo). Ver `proposal.md` - Why/What Changes para la motivación y el alcance funcional. Este documento cubre las decisiones técnicas necesarias para implementar las tres capabilities (`property-catalog`, `property-media`, `property-geolocation`) como un sistema full stack: backend NestJS, frontend Next.js, base de datos MariaDB, según lo solicitado.

## Goals / Non-Goals

**Goals:**
- Definir la arquitectura mínima viable para servir el catálogo de propiedades, sus medios y su geolocalización con el stack indicado (NestJS + Next.js + MariaDB + Google Maps).
- Definir el modelo de datos relacional que soporta múltiples tipos de vivienda con especificaciones comunes.
- Definir dónde y cómo se almacenan las fotos y videos.
- Definir cómo se integra Google Maps tanto en el backend (geocodificación) como en el frontend (visualización).

**Non-Goals:**
- Autenticación, autorización o gestión de usuarios (no forma parte de esta propuesta; ver proposal.md - What Changes).
- Infraestructura de despliegue en producción (CI/CD, orquestación, dominios, HTTPS) - queda fuera de este MVP de prueba.
- Optimización de imágenes/video (transcodificación, generación de miniaturas) más allá de una validación básica de formato/tamaño.
- Internacionalización (i18n) de la interfaz.

## Decisions

### 1. Estructura de repositorio: monorepo con dos paquetes
Se organiza como monorepo con `apps/api` (NestJS) y `apps/web` (Next.js), en vez de dos repos separados.
- **Por qué**: es un proyecto de prueba autocontenido; un monorepo simplifica compartir tipos (DTOs) entre backend y frontend y facilita levantar todo el entorno con un solo `docker-compose` o script.
- **Alternativa considerada**: repos separados backend/frontend - descartada por añadir fricción innecesaria a un MVP de prueba.

### 2. ORM: TypeORM sobre MariaDB
NestJS accede a MariaDB mediante TypeORM (driver `mysql2`, compatible con MariaDB).
- **Por qué**: integración de primera clase con NestJS (`@nestjs/typeorm`), soporta migraciones versionadas y el modelo relacional (propiedades 1-N medios) encaja bien con un ORM basado en entidades.
- **Alternativa considerada**: Prisma - también viable, pero TypeORM se integra de forma más directa con el patrón de módulos/decoradores de NestJS.

### 3. Modelo de datos: tabla única de propiedades + enum de tipo de vivienda
En vez de una tabla por tipo de vivienda, se usa una única tabla `properties` con una columna `type` (enum: `flat`, `house`, `chalet`, `attic`, `duplex`, `commercial`, `land`) y columnas comunes para todas las especificaciones inherentes (superficie, habitaciones, baños, planta, año de construcción, estado, precio, tipo de operación, certificado energético). Los campos que no aplican a un tipo concreto (por ejemplo, "planta" en un terreno) quedan nulos.
- **Por qué**: los tipos de vivienda solicitados comparten en la práctica el mismo conjunto de atributos; modelar una tabla por tipo obligaría a JOINs y a duplicar lógica de filtrado/listado sin beneficio real en este alcance.
- **Alternativa considerada**: herencia de tablas (una tabla base + una tabla por tipo) - descartada por sobre-ingeniería para el alcance de este MVP; se puede introducir más adelante como cambio incremental si algún tipo de vivienda necesita atributos muy divergentes.

Tablas principales:
- `properties`: datos y especificaciones de la propiedad (incluye `latitude`/`longitude` nullable para `property-geolocation`).
- `property_media`: fotos y videos, con `property_id` (FK), `type` (`photo`/`video`), `url`, `is_cover` (bool), `position` (orden), `created_at`.

### 4. Almacenamiento de medios: filesystem local servido como estático, con ruta abstraída
Las fotos y videos se guardan en el filesystem del servidor (`apps/api/storage/properties/<property_id>/...`), y NestJS expone esa carpeta como recursos estáticos; `property_media.url` guarda la ruta pública resultante.
- **Por qué**: es un proyecto de prueba, evita depender de credenciales de un proveedor cloud (S3 u otro) para poder levantarlo y probarlo localmente sin configuración adicional.
- **Alternativa considerada**: almacenamiento en un bucket S3-compatible (MinIO/S3) - se deja documentado como evolución natural (cambio incremental futuro) si el proyecto avanza más allá de prueba, ya que el acceso a los medios queda abstraído detrás de un `MediaStorageService` para poder sustituir la implementación sin tocar el resto del sistema.
- Validación de formato/tamaño (requisito de `property-media`) se aplica en el backend antes de persistir el archivo: imágenes (`jpg`, `png`, `webp`) hasta 10 MB, videos (`mp4`, `webm`) hasta 100 MB (valores configurables por variable de entorno).

### 5. Integración con Google Maps: Geocoding API en backend, Maps JavaScript API en frontend
- El backend llama a la **Geocoding API** de Google (vía HTTP) cuando una propiedad se crea/edita con dirección pero sin coordenadas, para resolver `latitude`/`longitude` (requisito "Geocodificación automática desde dirección").
- El frontend usa la **Maps JavaScript API** (a través de `@react-google-maps/api` o equivalente) para renderizar el mapa de detalle y el mapa de listado con marcadores.
- La clave de API de Google Maps se gestiona por variable de entorno, separada para backend (`GOOGLE_MAPS_SERVER_API_KEY`, restringida a Geocoding API) y frontend (`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY`, restringida por referer/dominio) - por qué: son dos claves con superficies de exposición distintas (una vive en el servidor, la otra se embebe en el cliente) y deben poder restringirse/rotarse de forma independiente.
- Manejo de errores del servicio (requisito correspondiente): si la geocodificación falla, la propiedad se guarda igualmente sin coordenadas; si el mapa no carga en el cliente, la ficha de propiedad se degrada mostrando el resto de la información sin bloquear la página.

### 6. API: REST con NestJS, versión de rutas `/api/v1`
Se expone una API REST convencional (`/api/v1/properties`, `/api/v1/properties/:id/media`, etc.) en vez de GraphQL.
- **Por qué**: el alcance (CRUD + filtros simples + subida de archivos) no requiere las ventajas de GraphQL y REST simplifica la subida de multipart/form-data para fotos/videos.

## Risks / Trade-offs

- [Almacenamiento local de medios no escala ni sobrevive a un redeploy sin volumen persistente] → Mitigación: `MediaStorageService` abstrae el almacenamiento; migrar a almacenamiento tipo S3 es un cambio incremental acotado a esa capa, sin afectar a `property-catalog` ni a la API pública de `property-media`.
- [Cuota/coste de las APIs de Google Maps (Geocoding + Maps JavaScript) si el catálogo crece] → Mitigación: cachear el resultado de geocodificación en la propia fila de `properties` (no se re-geocodifica si la dirección no cambia); en un entorno de prueba el volumen esperado es bajo.
- [Ausencia de autenticación implica que cualquiera con acceso a la API puede crear/editar/eliminar propiedades] → Mitigación: aceptado explícitamente como Non-Goal de este MVP de prueba (ver proposal.md); no exponer esta instancia fuera de un entorno controlado.
- [Sin transcodificación de video, archivos pesados o en formatos poco compatibles pueden no reproducirse bien en todos los navegadores] → Mitigación: limitar formatos aceptados a `mp4`/`webm` (compatibilidad amplia) y aplicar el límite de tamaño definido en la Decisión 4.

## Open Questions

- Proveedor concreto de hosting/entorno para las variables de API key de Google Maps en pruebas (local vs. servidor compartido `dashboard` descrito en CLAUDE.md) - no cambia specs, approach ni tasks; se resuelve al desplegar.
