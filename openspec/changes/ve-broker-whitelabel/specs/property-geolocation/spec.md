## MODIFIED Requirements

### Requirement: Visualizacion de multiples propiedades en mapa
El mapa del catálogo SHALL mostrar las propiedades geolocalizadas del resultado filtrado. Si no hay marcadores, el mapa SHALL centrarse en San Cristóbal, Táchira, Venezuela (latitud 7.7497768, longitud -72.2293373) con un zoom de ciudad, o en el centro configurado por el broker si lo ha personalizado.

#### Scenario: Catálogo vacío de coordenadas
- **WHEN** el listado no incluye propiedades con latitud y longitud
- **THEN** el mapa permanece usable para dibujar un área y se muestra centrado en San Cristóbal (o el centro guardado en la ficha del broker)
