# Proposal

## Why

El catálogo actual es un MVP genérico de España (piso, EUR, Madrid, hipoteca ITP/notaría) sin marca del broker ni forma de que un cliente venezolano contacte. Para desplegarlo y venderlo a otros asesores hace falta un sitio white-label en español venezolano, con admin, leads por WhatsApp y mapa centrado en San Cristóbal, Táchira.

## What Changes

- **BREAKING**: se eliminan el módulo de hipoteca, el certificado energético, la procedencia bancaria y los tipos de vivienda de España (`piso`, `chalet`, `ático`, `dúplex`).
- **BREAKING**: moneda y locale pasan a USD / `es-VE`. El centro del mapa por defecto es San Cristóbal, Táchira (no Madrid).
- Nueva ficha de broker editable (nombre comercial, logo, foto, WhatsApp, teléfono, email, redes, colores, centro de mapa).
- Autenticación de staff (broker): el catálogo público deja de permitir alta/edición/borrado.
- Estado de publicación (`draft` / `published` / `paused`); el público solo ve publicados.
- Campos venezolanos: título, descripción, estacionamiento, m² terreno, estado/municipio/parroquia/urbanización, amenidades locales.
- Captura de leads (formulario) y CTA WhatsApp con mensaje prefijado.
- UI pública con marca del broker, panel `/admin`, y CSS con breakpoints (celular, tablet, escritorio, TV).
- Empaquetado Docker de producción y guía de despliegue en Oracle Cloud Always Free.

## Capabilities

### New Capabilities
- `broker-settings`: identidad, contacto, tema y centro de mapa del broker, editables sin redeploy.
- `broker-auth`: login de staff, sesión por cookie httpOnly, protección de mutaciones.
- `property-leads`: mensajes de interesados y enlace WhatsApp en la ficha.

### Modified Capabilities
- `property-catalog`: taxonomía VE, quitar campos de España, título/descripcion, listingStatus, geo VE, amenidades, estacionamiento.
- `property-geolocation`: centro y zoom por defecto de San Cristóbal, Táchira.
- `mortgage-calculator`: se elimina por completo (normativa y copy de España).
- `property-media`: las mutaciones de medios quedan restringidas al broker autenticado.
- `commute-search`: copy VE (carro), filtro de publicados, se quita procedencia bancaria.

## Impact

- **Backend**: nuevas entidades `BrokerSettings`, `BrokerUser`, `PropertyLead`; migración de `properties` (enum de tipos, columnas nuevas, drop de `energy_certificate` e `is_bank_owned`); JWT + cookies; CORS con credenciales; se borra `mortgage-calculator`.
- **Frontend**: layout con marca, `/admin/*`, `/nosotros`, `/contacto`, locale USD/es-VE, responsive, WhatsApp FAB.
- **DevOps**: `Dockerfile` api/web, `docker-compose.prod.yml`, `docs/deploy-oracle-cloud.md`.
- **Tests**: fixtures dejan de usar `PropertyType.FLAT`, Madrid, EUR e hipoteca.
