## Purpose

Registra el histórico de precio de cada propiedad y calcula, a partir de los datos propios del catálogo, la evolución del precio medio por m² en la zona (ciudad/código postal) de una propiedad, para ayudar a valorar si su precio está en línea con la tendencia local.

## ADDED Requirements

### Requirement: Registro de histórico de precio de una propiedad
Cada vez que el precio de una propiedad se modifica, el sistema SHALL registrar el precio anterior y la fecha del cambio en el histórico de esa propiedad.

#### Scenario: Editar el precio de una propiedad
- **WHEN** se edita una propiedad cambiando su precio
- **THEN** el sistema añade un registro al histórico de precio de esa propiedad con el precio anterior y la fecha del cambio

#### Scenario: Editar una propiedad sin cambiar el precio
- **WHEN** se edita una propiedad sin modificar su precio
- **THEN** el sistema no añade ningún registro nuevo al histórico de precio

#### Scenario: Precio inicial de una propiedad nueva
- **WHEN** se crea una propiedad con un precio inicial
- **THEN** ese precio queda como referencia inicial del histórico, sin necesidad de un registro de "cambio" hasta la primera edición del precio

### Requirement: Cálculo de evolución de precio medio por m² en una zona
El sistema SHALL calcular, para una zona identificada por ciudad y/o código postal, la evolución del precio medio por m² a lo largo del tiempo, agregando los precios históricos de las propiedades de esa zona que tengan ciudad y código postal registrados.

#### Scenario: Zona con datos suficientes
- **WHEN** se solicita la evolución de precio de una zona que tiene un número suficiente de propiedades con histórico de precio (según un umbral mínimo configurable)
- **THEN** el sistema devuelve una serie temporal del precio medio por m² en esa zona

#### Scenario: Zona con datos insuficientes
- **WHEN** se solicita la evolución de precio de una zona que no alcanza el umbral mínimo de propiedades con histórico
- **THEN** el sistema informa de que no hay datos suficientes para mostrar una tendencia fiable en esa zona, en vez de devolver una serie poco representativa

### Requirement: Visualización de la evolución de precio en la ficha de propiedad
El sistema SHALL mostrar, en la ficha de detalle de una propiedad con ciudad y código postal registrados, la evolución del precio medio por m² de su zona, cuando existan datos suficientes.

#### Scenario: Ficha con tendencia de zona disponible
- **WHEN** se consulta el detalle de una propiedad cuya zona tiene datos suficientes de evolución de precio
- **THEN** la ficha muestra un gráfico con la evolución del precio medio por m² de esa zona

#### Scenario: Ficha sin tendencia de zona disponible
- **WHEN** se consulta el detalle de una propiedad cuya zona no tiene datos suficientes, o que no tiene ciudad/código postal registrados
- **THEN** la ficha se muestra igualmente, indicando que no hay datos de tendencia de zona disponibles
