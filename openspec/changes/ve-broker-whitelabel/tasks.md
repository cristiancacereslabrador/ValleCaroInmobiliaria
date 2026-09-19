## 1. Dominio venezolano y limpieza de España

- [x] 1.1 Actualizar enum de tipos VE, entidad Property (título, geo VE, amenidades, listingStatus, estacionamiento, m² terreno) y migración que convierte tipos viejos y elimina certificado energético, procedencia bancaria e hipoteca
- [x] 1.2 Actualizar DTOs, filtros, matcher de alertas, commute-search y tests para los nuevos campos; quitar isBankOwned/energyCertificate
- [x] 1.3 Eliminar el módulo mortgage-calculator (API, tests, UI, variables de entorno)

## 2. Broker settings, auth y leads

- [x] 2.1 Entidad e endpoints públicos/admin de BrokerSettings (defaults San Cristóbal) y subida de logo/foto
- [x] 2.2 Auth staff (login/logout/me, cookie JWT, seed de admin por env) y guards en mutaciones de propiedades y medios
- [x] 2.3 Entidad Lead, POST público, bandeja admin y CTA WhatsApp

## 3. Frontend white-label VE

- [x] 3.1 Layout público con marca del broker, locale USD/es-VE, mapa San Cristóbal, copy venezolano, sin hipoteca ni campos de España
- [x] 3.2 Panel /admin (login, dashboard, alta/edición, publicar/pausar, ajustes, leads)
- [x] 3.3 Ficha pública: WhatsApp, formulario de lead, páginas /nosotros y /contacto
- [x] 3.4 CSS responsive (celular, tablet, escritorio, TV) y FAB de contacto

## 4. Despliegue gratis

- [x] 4.1 Dockerfiles, compose de producción y guía Oracle Cloud Always Free
- [x] 4.2 Tests API + typecheck web en verde
