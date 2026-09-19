## Why

Fotocasa permite crear listas de favoritos etiquetadas (p. ej. "TOP 3", "Con terraza") y compartirlas mediante un enlace, sin necesidad de cuenta. El catálogo actual no tiene ninguna forma de guardar propiedades de interés ni de compartir una selección con otra persona.

## What Changes

- Se permite crear una lista con un nombre, añadirle propiedades del catálogo, y acceder/gestionar esa lista mediante un identificador único (sin necesidad de cuenta ni login), igual que el patrón ya usado para `saved-search-alerts`.
- Cada lista tiene un enlace de solo lectura que se puede compartir para que cualquiera con el enlace vea las propiedades incluidas, sin poder modificarla.

## Capabilities

### New Capabilities
- `saved-property-lists`: crear y gestionar listas de propiedades guardadas (añadir/quitar), y compartirlas mediante un enlace de solo lectura, sin necesidad de cuenta de usuario.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Backend**: nueva entidad `SavedPropertyList` (nombre, token de gestión, token de solo lectura para compartir) y `SavedPropertyListItem` (lista, propiedad); endpoints para crear lista, añadir/quitar propiedades, y consultar en modo gestión o en modo solo lectura (compartido).
- **Frontend**: botón de "guardar en lista" desde el listado/ficha de propiedad, página de gestión de una lista (vía su token de gestión, guardado en el navegador) y página pública de solo lectura para el enlace compartido.
- **Base de datos**: nuevas tablas `saved_property_lists` y `saved_property_list_items`.
