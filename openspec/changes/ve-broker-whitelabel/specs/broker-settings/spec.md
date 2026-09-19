## Purpose

Permite configurar la identidad, el contacto y el centro geográfico del broker para que el sitio público y los emails usen esos datos sin redeploy.

## ADDED Requirements

### Requirement: Consultar la ficha pública del broker
El sistema SHALL exponer la ficha del broker (nombre comercial, slogan, nombre y cargo del asesor, logo, foto, WhatsApp, teléfono, email, redes, dirección de oficina, colores, centro y zoom del mapa) sin exigir autenticación.

#### Scenario: Ficha con valores por defecto
- **WHEN** aún no se ha guardado ninguna personalización
- **THEN** el sistema devuelve valores por defecto con nombre comercial configurable y centro de mapa en San Cristóbal, Táchira

#### Scenario: Ficha personalizada
- **WHEN** el broker autenticado ha guardado logo, foto, WhatsApp y colores
- **THEN** el sistema público devuelve esos valores y el frontend los usa en header, footer y ficha de propiedad

### Requirement: Editar la ficha del broker
El sistema SHALL permitir al broker autenticado actualizar identidad, contacto, tema y centro de mapa.

#### Scenario: Actualización autenticada
- **WHEN** un broker autenticado envía cambios válidos de nombre, WhatsApp y coordenadas de mapa
- **THEN** el sistema persiste los cambios y las consultas públicas posteriores los reflejan

#### Scenario: Rechazo sin autenticación
- **WHEN** un visitante no autenticado intenta modificar la ficha
- **THEN** el sistema rechaza la operación

### Requirement: Centro de mapa de San Cristóbal
El centro de mapa por defecto SHALL ser la latitud 7.7497768 y la longitud -72.2293373 (San Cristóbal, Táchira, Venezuela) con zoom 13.

#### Scenario: Mapa de catálogo sin marcadores
- **WHEN** el listado no tiene propiedades geolocalizadas
- **THEN** el mapa se centra en San Cristóbal, Táchira, con zoom de ciudad
