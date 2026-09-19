## MODIFIED Requirements

### Requirement: Búsqueda por tiempo máximo de trayecto a un destino
La búsqueda por trayecto SHALL aplicarse solo a propiedades publicadas y geolocalizadas. Los medios de transporte se etiquetan en español venezolano (carro, transporte público, a pie). No se filtra por procedencia bancaria.

#### Scenario: Solo publicadas
- **WHEN** se busca por trayecto
- **THEN** el resultado no incluye borradores ni propiedades pausadas
