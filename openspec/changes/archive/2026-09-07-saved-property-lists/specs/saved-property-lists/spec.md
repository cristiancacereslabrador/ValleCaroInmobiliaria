## Purpose

Permite crear listas de propiedades guardadas del catálogo, gestionarlas y compartirlas mediante un enlace de solo lectura, sin necesidad de cuenta de usuario.

## ADDED Requirements

### Requirement: Crear una lista de propiedades guardadas
El sistema SHALL permitir crear una lista con un nombre, sin necesidad de cuenta de usuario ni login, devolviendo un identificador de gestión que permite añadir o quitar propiedades de esa lista y un identificador de solo lectura para compartirla.

#### Scenario: Creación exitosa de una lista
- **WHEN** se solicita crear una lista indicando un nombre válido
- **THEN** el sistema crea la lista vacía y devuelve su identificador de gestión y su identificador de solo lectura, ambos distintos entre sí

### Requirement: Añadir y quitar propiedades de una lista
El sistema SHALL permitir, usando el identificador de gestión de una lista, añadir propiedades del catálogo a esa lista y quitarlas de ella.

#### Scenario: Añadir una propiedad existente
- **WHEN** se solicita añadir una propiedad existente del catálogo a una lista usando su identificador de gestión
- **THEN** el sistema añade esa propiedad a la lista

#### Scenario: Añadir una propiedad ya presente en la lista
- **WHEN** se solicita añadir a una lista una propiedad que ya está incluida en ella
- **THEN** el sistema no duplica la entrada, dejando la lista sin cambios

#### Scenario: Quitar una propiedad de la lista
- **WHEN** se solicita quitar de una lista una propiedad que está incluida en ella
- **THEN** el sistema la elimina de la lista

#### Scenario: Gestión con identificador inválido
- **WHEN** se solicita añadir o quitar una propiedad usando un identificador de gestión que no corresponde a ninguna lista
- **THEN** el sistema rechaza la operación e informa que la lista no existe

### Requirement: Consultar una lista en modo gestión
El sistema SHALL permitir consultar el contenido completo de una lista (incluyendo sus identificadores) usando su identificador de gestión.

#### Scenario: Consulta con identificador de gestión válido
- **WHEN** se consulta una lista usando su identificador de gestión
- **THEN** el sistema devuelve el nombre de la lista, sus propiedades y ambos identificadores (gestión y solo lectura)

### Requirement: Consultar una lista compartida en modo solo lectura
El sistema SHALL permitir consultar el nombre y las propiedades de una lista usando su identificador de solo lectura, sin exponer su identificador de gestión y sin permitir modificarla desde ese acceso.

#### Scenario: Consulta con identificador de solo lectura válido
- **WHEN** se consulta una lista usando su identificador de solo lectura
- **THEN** el sistema devuelve el nombre de la lista y sus propiedades, sin incluir el identificador de gestión

#### Scenario: Intento de modificar la lista desde el identificador de solo lectura
- **WHEN** se intenta añadir o quitar una propiedad de una lista usando su identificador de solo lectura en vez del de gestión
- **THEN** el sistema rechaza la operación e informa que ese identificador no permite modificar la lista
