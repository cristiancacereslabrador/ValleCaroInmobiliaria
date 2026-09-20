import { readFileSync } from 'node:fs';
import path from 'node:path';

const API = 'http://127.0.0.1:3001/api/v1';
const EMAIL = 'broker@local.test';
const PASSWORD = 'changeme123';
const ASSETS = process.env.ASSETS_DIR
  || 'C:\\Users\\crist\\.cursor\\projects\\c-Users-crist-OneDrive-Documentos-INMOB2026\\assets';

const BROKER = {
  businessName: 'Portal de captaciones',
  slogan: 'Captaciones en San Cristóbal y el Táchira.',
  advisorName: 'Liseth Carolina Valladares Gutiérrez',
  advisorTitle: 'Asesora · Century 21',
  whatsapp: '584247255817',
  phone: '+58 424-7255817',
  email: 'liseht87@gmail.com',
  instagram: '@c21_lisethvalladares',
  facebook: 'https://www.facebook.com/share/1EddJksTZ6/',
  officeAddress: 'San Cristóbal, Táchira',
  coverageText: 'San Cristóbal, Táchira y municipios vecinos',
  businessHours: 'Lun–Vie 8:00–18:00 · Sáb 9:00–13:00',
  footerLegal: 'Liseth Valladares · Portal de captaciones · San Cristóbal, Táchira',
  primaryColor: '#E11D8A',
  secondaryColor: '#6D28D9',
  aboutText:
    'Liseth Carolina Valladares Gutiérrez asesora compra, venta y alquiler en San Cristóbal y el Táchira, con atención directa por WhatsApp, Instagram y Facebook. Recorre La Concordia, Pirineos, Pueblo Nuevo y la zona industrial cada semana, con el criterio de quien vive la ciudad y no solo publica anuncios.\n\n' +
    'Trabajamos apartamentos, quintas, locales y fincas con fotos reales y datos completos: planta eléctrica, tanque de agua, conjunto cerrado y lo que en esta región marca la diferencia.',
};

const COPY = {
  apartment: {
    title: 'Apartamento de 92 m² con planta eléctrica en La Concordia',
    description:
      'Tres habitaciones y dos baños en un edificio con vigilancia y planta eléctrica, a minutos del centro de San Cristóbal. El apartamento está en el nivel 4, con balcón, aire acondicionado y un puesto de estacionamiento.\n\nUrbanización consolidada, vecindario residencial y servicios a pie. Ideal para una familia que busca seguridad sin alejarse de la ciudad. Entrega en buen estado, lista para habitar.',
  },
  house: {
    title: 'Casa familiar con jardín y dos puestos en Pueblo Nuevo',
    description:
      'Casa de 180 m² construidos sobre 320 m² de terreno, con cuatro habitaciones, tres baños y jardín. Cocina amplia abierta al patio, tanque de agua y gas directo: pensada para el día a día tachirense.\n\nPueblo Nuevo es residencial, cercano al centro y con buena circulación. La casa, de 2012, está en buen estado y admite una familia grande o quien quiera trabajar desde casa con espacio real.',
  },
  quinta: {
    title: 'Quinta con piscina y vista a las montañas en Pirineos',
    description:
      'Quinta de 340 m² en conjunto cerrado, con cinco habitaciones, cuatro baños, piscina y jardín sobre 900 m². Vista a las montañas del Táchira, planta eléctrica y vigilancia 24 horas.\n\nPirineos es una de las zonas más solicitadas de San Cristóbal para quien busca privacidad y área social. Acabados de 2016 en excelente estado; lista para recibir visitas o vivir con holgura.',
  },
  townhouse: {
    title: 'Townhouse de estreno con terraza en Las Lomas',
    description:
      'Tres niveles, 160 m², terraza y dos puestos cubiertos en conjunto privado. Tres habitaciones, tres baños, aire acondicionado y vigilancia. Construcción 2020, entrega de estreno.\n\nLas Lomas combina altura, brisa y acceso rápido a la ciudad. El townhouse funciona igual de bien como vivienda principal o como inversión de alquiler ejecutivo.',
  },
  penthouse: {
    title: 'Penthouse con terraza y vista al valle, Centro',
    description:
      '210 m² en el nivel 12, tres habitaciones, tres baños y terraza con vista al valle de San Cristóbal. Acabados de lujo, ascensor, planta eléctrica y dos puestos.\n\nSobre la Avenida 7, a pasos del centro, pero con la privacidad de un último piso. Ideal para quien quiere ciudad y horizonte en el mismo inmueble.',
  },
  studio: {
    title: 'Estudio amoblado listo para entrar en Barrio Obrero',
    description:
      '38 m² amoblados, con aire acondicionado y cocina compacta. Un ambiente más baño, segundo piso, pensado para profesional, médico o estudiante de la ULA Táchira.\n\nAlquiler mensual en zona con comercio, transporte y servicios. Entras con maleta: cama, escritorio y menaje básico incluidos.',
  },
  commercial: {
    title: 'Local a pie de calle en 5ta Avenida',
    description:
      '75 m² de local en la 5ta Avenida, vitrina a calle y un baño. Zona de alto tránsito peatonal en el centro de San Cristóbal: ropa, farmacia, café o servicios profesionales.\n\nEl local admite una adecuación ligera según el giro. Renta competitiva para quien necesita visibilidad, no un centro comercial.',
  },
  warehouse: {
    title: 'Galpón con patio de maniobra en Zona Industrial',
    description:
      '850 m² techados sobre 1.200 m² de terreno, altura libre, patio para gandolas, planta eléctrica, tanque de agua y vigilancia. Seis puestos y dos baños.\n\nZona Industrial de San Cristóbal, acceso de carga y operación continua. Pensado para distribución, taller o almacenamiento regional.',
  },
  office: {
    title: 'Oficina climatizada en el Centro Financiero',
    description:
      '55 m² en el piso 6 de la Avenida Libertador, con recepción compartida, ascensor, planta eléctrica y un puesto. Lista para despacho, estudio jurídico o startup.\n\nEdificio de 2019, climatizado, frente a la zona financiera. Alquiler mensual con imagen corporativa desde el primer día.',
  },
  land: {
    title: 'Terreno plano de 450 m² en San Josecito, Torbes',
    description:
      'Lote regular, frente de calle, listo para vivienda o local. 450 m² en San Josecito, municipio Torbes, a minutos de San Cristóbal por la arteria principal.\n\nTerreno plano, sin construcciones que demoler. Opción clara para quien quiere construir a su medida o desarrollar un pequeño comercio de barrio.',
  },
  farm: {
    title: 'Finca productiva con pozo y casa en Capacho',
    description:
      '4,5 hectáreas con casa principal de 220 m², tres habitaciones, potreros, pozo de agua y tanque de agua. A minutos de San Cristóbal, en Capacho (municipio Independencia).\n\nFinca en producción, con reja y acceso vehicular. Sirve como retiro de fin de semana, proyecto agropecuario o inversión de tierra en los Andes tachirenses.',
  },
};

const PHOTOS = {
  apartment: ['apartment-cover.png', 'apartment-interior.png', 'apartment-bedroom.png'],
  house: ['house-cover.png', 'house-interior.png', 'house-garden.png'],
  quinta: ['quinta-cover.png', 'quinta-interior.png', 'quinta-pool.png'],
  townhouse: ['townhouse-cover.png', 'townhouse-interior.png', 'townhouse-terrace.png'],
  penthouse: ['penthouse-cover.png', 'penthouse-interior.png', 'penthouse-kitchen.png'],
  studio: ['studio-cover.png', 'studio-interior.png', 'studio-bath.png'],
  commercial: ['commercial-cover.png', 'commercial-interior.png', 'commercial-street.png'],
  warehouse: ['warehouse-cover.png', 'warehouse-interior.png', 'warehouse-yard.png'],
  office: ['office-cover.png', 'office-interior.png', 'office-reception.png'],
  land: ['land-cover.png', 'land-detail.png', 'land-mountains.png'],
  farm: ['farm-cover.png', 'farm-house.png', 'farm-pasture.png'],
};

function cookieHeader(setCookie) {
  return setCookie
    .split(/,(?=\s*[^;]+=)/)
    .map((part) => part.split(';')[0].trim())
    .join('; ');
}

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function fileBlob(name) {
  const buf = readFileSync(path.join(ASSETS, name));
  return new Blob([buf], { type: 'image/png' });
}

async function main() {
  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!login.ok) throw new Error(`Login: ${login.status} ${await login.text()}`);
  const cookie = cookieHeader(login.headers.get('set-cookie') ?? '');
  const auth = { Cookie: cookie };

  const settingsRes = await fetch(`${API}/admin/broker-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(BROKER),
  });
  if (!settingsRes.ok) throw new Error(`Settings: ${settingsRes.status} ${await settingsRes.text()}`);
  console.log('OK broker settings');

  const photo = new FormData();
  photo.append('file', fileBlob('advisor-portrait.png'), 'advisor-portrait.png');
  const photoRes = await fetch(`${API}/admin/broker-settings/photo`, {
    method: 'POST',
    headers: auth,
    body: photo,
  });
  if (!photoRes.ok) throw new Error(`Advisor photo: ${photoRes.status} ${await photoRes.text()}`);
  console.log('OK advisor photo');

  const listRes = await fetch(`${API}/admin/properties`, { headers: auth });
  if (!listRes.ok) throw new Error(`List: ${listRes.status}`);
  const properties = await json(listRes);

  for (const property of properties) {
    const copy = COPY[property.type];
    const photos = PHOTOS[property.type];
    if (!copy || !photos) {
      console.log(`SKIP ${property.type} ${property.id}`);
      continue;
    }

    const patch = await fetch(`${API}/properties/${property.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(copy),
    });
    if (!patch.ok) throw new Error(`Patch ${property.type}: ${patch.status} ${await patch.text()}`);

    const mediaRes = await fetch(`${API}/properties/${property.id}/media`, { headers: auth });
    const media = mediaRes.ok ? await json(mediaRes) : [];
    for (const item of media) {
      await fetch(`${API}/properties/${property.id}/media/${item.id}`, {
        method: 'DELETE',
        headers: auth,
      });
    }

    for (const [index, filename] of photos.entries()) {
      const form = new FormData();
      form.append('file', fileBlob(filename), filename);
      const up = await fetch(`${API}/properties/${property.id}/media`, {
        method: 'POST',
        headers: auth,
        body: form,
      });
      if (!up.ok) throw new Error(`Upload ${filename}: ${up.status} ${await up.text()}`);
      if (index === 0) {
        const uploaded = await json(up);
        if (uploaded?.id) {
          await fetch(`${API}/properties/${property.id}/media/${uploaded.id}/cover`, {
            method: 'PATCH',
            headers: auth,
          });
        }
      }
    }
    console.log(`OK ${property.type} ${copy.title}`);
  }

  console.log('Listo: textos, ficha ValleCaro y fotos fotorrealistas.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
