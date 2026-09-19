## Why

Fotocasa se diferencia por dar contexto de zona más allá de la ficha del inmueble: qué servicios hay cerca (colegios, transporte, supermercados) y cómo evoluciona el precio del m² en esa área. Sin esta información, el catálogo solo muestra el inmueble aislado, sin ayudar a valorar si la zona es adecuada o si el precio está en línea con la tendencia local.

## What Changes

- Se añade, en la ficha de cada propiedad geolocalizada, un listado de puntos de interés cercanos (colegios, transporte público, supermercados) obtenido a partir de sus coordenadas.
- Se añaden a la propiedad los campos de ciudad y código postal, necesarios para poder agrupar propiedades por zona.
- Se añade un histórico de precio por propiedad: cada vez que el precio de una propiedad cambia, se registra el valor anterior y la fecha del cambio.
- Se añade el cálculo y visualización de la evolución del precio medio por m² en la zona (código postal/ciudad) de una propiedad, calculado exclusivamente a partir de los datos propios del catálogo (sin depender de una fuente de datos de mercado externa).

## Capabilities

### New Capabilities
- `nearby-services`: consulta y visualización de puntos de interés cercanos (colegios, transporte, supermercados) a partir de las coordenadas de una propiedad.
- `price-trends`: histórico de precio por propiedad y cálculo/visualización de la evolución del precio medio por m² en la zona de una propiedad, a partir de los datos del propio catálogo.

### Modified Capabilities
- `property-catalog`: se añaden los campos de ciudad y código postal a las especificaciones de la propiedad, necesarios para agrupar por zona.

## Impact

- **Backend**: nuevo módulo que consulta la API de Google Places (Nearby Search) a partir de las coordenadas de una propiedad; nueva tabla de histórico de precio (`property_price_history`); nuevo endpoint/lógica de agregación para calcular la evolución de precio por zona.
- **Frontend**: nueva sección en la ficha de propiedad para el entorno (listado de puntos de interés con distancia) y para la gráfica de evolución de precio de la zona.
- **Base de datos**: nuevas columnas `city`/`postalCode` en `properties`; nueva tabla `property_price_history` (property_id, price, recorded_at).
- **Dependencias externas**: Google Places API (Nearby Search) - reutiliza la misma cuenta/proyecto de Google Cloud ya usado para Maps/Geocoding, pero requiere habilitar esa API adicional y puede implicar coste según cuota.
- **Limitación aceptada explícitamente** (ver design.md): la evolución de precio por zona depende de que existan suficientes propiedades con histórico en esa zona; con pocos datos, el sistema debe indicarlo en vez de mostrar una tendencia poco representativa.
