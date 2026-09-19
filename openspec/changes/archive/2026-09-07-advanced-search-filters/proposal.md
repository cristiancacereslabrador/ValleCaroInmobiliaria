## Why

El catálogo actual solo filtra por tipo de vivienda, operación y rango de precio. Los tres portales inmobiliarios de referencia en España (Idealista, Fotocasa, Pisos.com) ofrecen una búsqueda mucho más precisa: dibujar a mano alzada la zona exacta de interés sobre el mapa, y descartar resultados por atributos concretos del inmueble (sin ascensor, planta baja, necesita reforma, procedente de banco/embargo). Sin esto, el catálogo se queda corto frente a lo que el usuario final espera de un buscador inmobiliario serio.

## What Changes

- Se añade a cada propiedad la posibilidad de registrar: si tiene ascensor, si necesita reforma y si procede de un banco/embargo.
- Se extiende el listado de propiedades para poder filtrar además por: presencia de ascensor, planta baja, necesidad de reforma y procedencia bancaria.
- Se añade búsqueda geográfica por área: el usuario puede definir un polígono arbitrario (dibujado a mano alzada sobre el mapa) y el sistema devuelve solo las propiedades geolocalizadas dentro de esa área.

## Capabilities

### New Capabilities
<!-- Ninguna: se extiende funcionalidad ya existente. -->

### Modified Capabilities
- `property-catalog`: se añaden nuevos atributos filtrables (ascensor, necesidad de reforma, procedencia bancaria) y se extiende el listado/filtrado para soportarlos.
- `property-geolocation`: se añade búsqueda de propiedades por área geográfica arbitraria (polígono dibujado en el mapa), además de la visualización por marcadores ya existente.

## Impact

- **Backend**: nuevas columnas en la entidad `Property` (`hasElevator`, `needsRenovation`, `isBankOwned`); nuevo endpoint o extensión del listado para aceptar un polígono geográfico y filtrar por contención de coordenadas.
- **Frontend**: nuevos controles de filtro en el listado; herramienta de dibujo de polígono sobre el mapa de Google Maps (Drawing Library) que alimenta la búsqueda.
- **Base de datos**: migración añadiendo las nuevas columnas a `properties`; el filtrado por polígono puede resolverse en la propia consulta (comprobación punto-en-polígono) sin requerir extensiones espaciales adicionales de MariaDB, dado el volumen esperado de un proyecto de prueba.
