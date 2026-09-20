## Purpose

Permite a un interesado contactar al broker desde la ficha de una propiedad publicada, por WhatsApp o dejando un mensaje.

## ADDED Requirements

### Requirement: CTA de WhatsApp en la ficha
Si el broker tiene WhatsApp configurado, la ficha de una propiedad publicada SHALL mostrar un enlace a WhatsApp con un mensaje prefijado que incluye el título (o tipo) de la propiedad y su URL pública.

#### Scenario: WhatsApp configurado
- **WHEN** un visitante abre una propiedad publicada y el broker tiene número WhatsApp
- **THEN** el sistema muestra un botón que abre WhatsApp con el mensaje prefijado

#### Scenario: WhatsApp no configurado
- **WHEN** el broker no ha indicado WhatsApp
- **THEN** el sistema no muestra el botón de WhatsApp y deja el formulario de mensaje

### Requirement: Enviar un mensaje de interés
El sistema SHALL permitir enviar un mensaje de interés (nombre, email o teléfono, y texto) sobre una propiedad publicada, sin exigir cuenta de usuario.

#### Scenario: Mensaje válido
- **WHEN** un visitante envía nombre, un medio de contacto y un mensaje de al menos 10 caracteres sobre una propiedad publicada
- **THEN** el sistema guarda el lead y confirma el envío

#### Scenario: Propiedad no publicada
- **WHEN** se intenta enviar un lead sobre una propiedad que no está publicada
- **THEN** el sistema rechaza la operación

### Requirement: Bandeja de leads del broker
El sistema SHALL permitir al staff autenticado listar los mensajes recibidos, más recientes primero.

#### Scenario: Staff consulta leads
- **WHEN** un staff autenticado solicita la bandeja
- **THEN** el sistema devuelve los leads con propiedad, nombre, contacto, mensaje y fecha

### Requirement: Tasación pública sin precio
La página pública de tasación SHALL recoger tipo de inmueble, contacto y datos opcionales del inmueble, y SHALL NOT mostrar un precio de venta ni de alquiler. El monto lo sugiere el asesor después de conocer la propiedad y entregar un informe; el propietario decide el precio de publicación.

#### Scenario: Visitante solicita tasación
- **WHEN** un visitante envía tipo de vivienda y un medio de contacto
- **THEN** el sistema guarda un lead de origen tasación y confirma que un asesor visitará, analizará y entregará un informe

#### Scenario: La página no revela un estimado
- **WHEN** el visitante completa la solicitud de tasación
- **THEN** no se muestra rango de precio de venta ni de alquiler
