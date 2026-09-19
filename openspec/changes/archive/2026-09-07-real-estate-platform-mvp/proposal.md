## Why

No existe todavía ninguna plataforma para gestionar un catálogo de propiedades inmobiliarias en este proyecto. Se necesita un sistema web full stack de prueba que permita administrar inmuebles (con sus datos, fotos, videos y ubicación en mapa) como base sobre la que iterar con cambios incrementales futuros.

## What Changes

- Se introduce un sistema de gestión de propiedades inmobiliarias: alta, edición, baja y consulta de inmuebles.
- Soporte para múltiples tipos de vivienda (piso, casa, chalet, ático, dúplex, local comercial, terreno, etc.), cada uno con especificaciones propias del sector inmobiliario (superficie, habitaciones, baños, planta, año de construcción, estado, precio, tipo de operación -venta/alquiler-, certificado energético, etc.).
- Se introduce gestión multimedia por propiedad: carga, listado y eliminación de múltiples fotos y videos asociados a cada inmueble.
- Se introduce geolocalización de propiedades mediante integración con Google Maps: cada inmueble tiene coordenadas y puede visualizarse en un mapa interactivo.
- Alcance delimitado a un MVP: sin autenticación de usuarios, sin gestión de leads/contactos, sin pasarela de pagos ni agenda de visitas. Estas quedan fuera de esta propuesta y podrán proponerse como cambios incrementales posteriores.

## Capabilities

### New Capabilities
- `property-catalog`: alta, edición, baja y consulta de propiedades inmobiliarias, incluyendo tipo de vivienda y sus especificaciones inherentes (superficie, habitaciones, baños, planta, año de construcción, estado, precio, tipo de operación, certificado energético, etc.).
- `property-media`: carga, almacenamiento, listado y eliminación de fotos y videos asociados a una propiedad.
- `property-geolocation`: geolocalización de propiedades y visualización en un mapa interactivo mediante Google Maps.

### Modified Capabilities
<!-- No aplica: no existen capabilities previas en este proyecto (primer change). -->

## Impact

- **Backend**: nueva API construida con NestJS (módulos de propiedades, medios y geolocalización).
- **Frontend**: nueva aplicación con Next.js que consume la API y renderiza el catálogo, fichas de propiedad, formularios de gestión y el mapa de Google Maps.
- **Base de datos**: nuevo esquema en MariaDB (propiedades, tipos de vivienda, especificaciones, medios).
- **Dependencias externas**: API de Google Maps (Maps JavaScript API / Geocoding API) - requiere API key propia.
- **Almacenamiento**: necesidad de un mecanismo de almacenamiento de archivos (fotos/videos) a definir en design.md.
