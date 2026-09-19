import zlib from 'node:zlib';

const API = 'http://127.0.0.1:3001/api/v1';
const EMAIL = 'broker@local.test';
const PASSWORD = 'changeme123';

const SAMPLES = [
  {
    type: 'apartment',
    operationType: 'sale',
    title: 'Apartamento en La Concordia',
    description: 'Apartamento de 3 habitaciones en urbanización consolidada de San Cristóbal, con vigilancia y planta eléctrica.',
    price: 85000,
    surfaceM2: 92,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 1,
    floor: 4,
    constructionYear: 2018,
    status: 'buen estado',
    address: 'Urb. La Concordia, San Cristóbal',
    parish: 'La Concordia',
    urbanization: 'La Concordia',
    latitude: 7.7612,
    longitude: -72.2251,
    hasElevator: true,
    hasPowerPlant: true,
    hasSecurity: true,
    hasAirConditioning: true,
    colors: [[46, 125, 122], [232, 213, 163], [90, 74, 66]],
  },
  {
    type: 'house',
    operationType: 'sale',
    title: 'Casa en Pueblo Nuevo',
    description: 'Casa familiar con jardín y estacionamiento para dos vehículos, cerca del centro de San Cristóbal.',
    price: 120000,
    surfaceM2: 180,
    landSurfaceM2: 320,
    bedrooms: 4,
    bathrooms: 3,
    parkingSpaces: 2,
    constructionYear: 2012,
    status: 'buen estado',
    address: 'Pueblo Nuevo, San Cristóbal',
    parish: 'San Juan Bautista',
    urbanization: 'Pueblo Nuevo',
    latitude: 7.7718,
    longitude: -72.2214,
    hasGarden: true,
    hasCistern: true,
    hasDirectGas: true,
    colors: [[139, 90, 43], [212, 175, 106], [72, 96, 72]],
  },
  {
    type: 'quinta',
    operationType: 'sale',
    title: 'Quinta en Pirineos',
    description: 'Quinta amplia en conjunto cerrado, con piscina, jardín y vista a las montañas del Táchira.',
    price: 280000,
    surfaceM2: 340,
    landSurfaceM2: 900,
    bedrooms: 5,
    bathrooms: 4,
    parkingSpaces: 4,
    constructionYear: 2016,
    status: 'excelente',
    address: 'Pirineos, San Cristóbal',
    parish: 'Pedro María Morantes',
    urbanization: 'Pirineos',
    latitude: 7.7845,
    longitude: -72.1988,
    isGatedCommunity: true,
    hasPool: true,
    hasGarden: true,
    hasPowerPlant: true,
    hasSecurity: true,
    colors: [[26, 92, 64], [196, 214, 176], [245, 236, 213]],
  },
  {
    type: 'townhouse',
    operationType: 'sale',
    title: 'Townhouse en Las Lomas',
    description: 'Townhouse de tres niveles en conjunto privado, con terraza y puesto de estacionamiento cubierto.',
    price: 145000,
    surfaceM2: 160,
    bedrooms: 3,
    bathrooms: 3,
    parkingSpaces: 2,
    constructionYear: 2020,
    status: 'estreno',
    address: 'Las Lomas, San Cristóbal',
    parish: 'Pedro María Morantes',
    urbanization: 'Las Lomas',
    latitude: 7.7689,
    longitude: -72.2066,
    isGatedCommunity: true,
    hasAirConditioning: true,
    hasSecurity: true,
    colors: [[90, 62, 90], [210, 180, 140], [48, 48, 48]],
  },
  {
    type: 'penthouse',
    operationType: 'sale',
    title: 'Penthouse en el Centro',
    description: 'Penthouse con terraza, acabados de lujo y vista al valle de San Cristóbal.',
    price: 210000,
    surfaceM2: 210,
    bedrooms: 3,
    bathrooms: 3,
    parkingSpaces: 2,
    floor: 12,
    constructionYear: 2021,
    status: 'excelente',
    address: 'Av. 7, Centro, San Cristóbal',
    parish: 'San Juan Bautista',
    latitude: 7.7674,
    longitude: -72.2247,
    hasElevator: true,
    hasAirConditioning: true,
    hasPowerPlant: true,
    colors: [[30, 58, 95], [200, 184, 150], [240, 240, 240]],
  },
  {
    type: 'studio',
    operationType: 'rent',
    title: 'Estudio amoblado en Barrio Obrero',
    description: 'Estudio listo para habitar, ideal para profesional o estudiante, con servicios cerca.',
    price: 280,
    surfaceM2: 38,
    bedrooms: 1,
    bathrooms: 1,
    parkingSpaces: 0,
    floor: 2,
    constructionYear: 2015,
    status: 'buen estado',
    address: 'Barrio Obrero, San Cristóbal',
    parish: 'Pedro María Morantes',
    latitude: 7.7556,
    longitude: -72.2318,
    isFurnished: true,
    hasAirConditioning: true,
    colors: [[180, 90, 70], [245, 230, 210], [90, 90, 90]],
  },
  {
    type: 'commercial',
    operationType: 'rent',
    title: 'Local comercial en 5ta Avenida',
    description: 'Local a pie de calle en zona de alto tránsito comercial del centro de San Cristóbal.',
    price: 650,
    surfaceM2: 75,
    bathrooms: 1,
    parkingSpaces: 0,
    constructionYear: 2008,
    status: 'a remodelar',
    address: '5ta Avenida, San Cristóbal',
    parish: 'San Juan Bautista',
    latitude: 7.7661,
    longitude: -72.2269,
    needsRenovation: false,
    colors: [[180, 40, 40], [250, 245, 235], [40, 40, 40]],
  },
  {
    type: 'warehouse',
    operationType: 'sale',
    title: 'Galpón en Zona Industrial',
    description: 'Galpón con patio de maniobra, altura libre y acceso para gandolas.',
    price: 190000,
    surfaceM2: 850,
    landSurfaceM2: 1200,
    bathrooms: 2,
    parkingSpaces: 6,
    constructionYear: 2010,
    status: 'operativo',
    address: 'Zona Industrial, San Cristóbal',
    parish: 'La Concordia',
    latitude: 7.7422,
    longitude: -72.2385,
    hasPowerPlant: true,
    hasCistern: true,
    hasSecurity: true,
    colors: [[90, 90, 90], [160, 140, 90], [50, 70, 90]],
  },
  {
    type: 'office',
    operationType: 'rent',
    title: 'Oficina en el Centro Financiero',
    description: 'Oficina climatizada con recepción compartida, ideal para despacho o startup.',
    price: 420,
    surfaceM2: 55,
    bathrooms: 1,
    parkingSpaces: 1,
    floor: 6,
    constructionYear: 2019,
    status: 'buen estado',
    address: 'Av. Libertador, San Cristóbal',
    parish: 'San Juan Bautista',
    latitude: 7.7699,
    longitude: -72.2288,
    hasElevator: true,
    hasAirConditioning: true,
    hasPowerPlant: true,
    colors: [[40, 70, 110], [220, 220, 220], [180, 150, 90]],
  },
  {
    type: 'land',
    operationType: 'sale',
    title: 'Terreno en San Josecito',
    description: 'Terreno plano con frente de calle, listo para construir vivienda o local.',
    price: 35000,
    landSurfaceM2: 450,
    address: 'San Josecito, municipio Torbes',
    municipality: 'Torbes',
    parish: 'San Josecito',
    latitude: 7.7284,
    longitude: -72.2191,
    status: 'listo para construir',
    colors: [[90, 140, 70], [180, 160, 90], [120, 90, 50]],
  },
  {
    type: 'farm',
    operationType: 'sale',
    title: 'Finca en Capacho',
    description: 'Finca con pozo de agua, casa principal y potreros, a minutos de San Cristóbal.',
    price: 160000,
    surfaceM2: 220,
    landSurfaceM2: 45000,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 3,
    constructionYear: 2005,
    status: 'productiva',
    address: 'Capacho, Táchira',
    municipality: 'Independencia',
    parish: 'Capacho Nuevo',
    latitude: 7.8255,
    longitude: -72.3012,
    hasWaterWell: true,
    hasCistern: true,
    hasGarden: true,
    colors: [[70, 110, 50], [150, 110, 60], [210, 190, 140]],
  },
];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(width, height, rgbFn) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = rgbFn(x, y);
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function samplePhoto(color, variant) {
  const [cr, cg, cb] = color;
  return makePng(960, 640, (x, y) => {
    const sky = 40 + variant * 18;
    if (y < 220) {
      return [sky + 30, sky + 50, Math.min(255, sky + 90)];
    }
    const house = y > 260 && y < 500 && x > 180 + variant * 40 && x < 760 - variant * 20;
    if (house) {
      const window = (x % 90 < 35 && y % 70 > 20 && y % 70 < 50);
      if (window) return [240, 230, 180];
      return [cr, cg, cb];
    }
    const ground = 70 + ((x + y + variant * 30) % 20);
    return [ground, ground + 20, ground - 10];
  });
}

function cookieHeader(setCookie) {
  return setCookie
    .split(/,(?=\s*[^;]+=)/)
    .map((part) => part.split(';')[0].trim())
    .join('; ');
}

async function main() {
  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!login.ok) {
    throw new Error(`Login falló: ${login.status} ${await login.text()}`);
  }
  const cookie = cookieHeader(login.headers.get('set-cookie') ?? '');
  if (!cookie) throw new Error('No se recibió cookie de sesión');

  const created = [];
  for (const sample of SAMPLES) {
    const { colors, ...payload } = sample;
    const res = await fetch(`${API}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        ...payload,
        listingStatus: 'published',
        state: 'Táchira',
        municipality: payload.municipality ?? 'San Cristóbal',
        city: 'San Cristóbal',
        postalCode: '5001',
      }),
    });
    if (!res.ok) {
      throw new Error(`Crear ${sample.type} falló: ${res.status} ${await res.text()}`);
    }
    const property = await res.json();

    for (let i = 0; i < 3; i += 1) {
      const png = samplePhoto(colors[i], i);
      const form = new FormData();
      form.append('file', new Blob([png], { type: 'image/png' }), `${sample.type}-${i + 1}.png`);
      const up = await fetch(`${API}/properties/${property.id}/media`, {
        method: 'POST',
        headers: { Cookie: cookie },
        body: form,
      });
      if (!up.ok) {
        throw new Error(`Foto ${i + 1} de ${sample.type} falló: ${up.status} ${await up.text()}`);
      }
    }
    created.push(`${sample.type} ${property.id}`);
    console.log(`OK ${sample.type} ${property.title}`);
  }
  console.log(`Listo: ${created.length} propiedades, 3 fotos cada una.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
