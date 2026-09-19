# Despliegue gratis y persistente — Oracle Cloud Always Free

## Por qué esta opción

El stack (NestJS + Next.js + MariaDB + fotos en disco) necesita un proceso
siempre encendido y volumen persistente. Las alternativas “gratis” actuales
no encajan:

| Plataforma | Problema |
|---|---|
| Render free | Se duerme; la base gratis caduca |
| Fly.io | Ya no hay free permanente |
| Vercel Hobby | Excelente para Next, no para Nest + MariaDB + uploads |
| Railway | Créditos de prueba, luego se cobra |

**Oracle Cloud Always Free** no es un trial de 30 días: la VM Ampere A1
(ARM) y el block storage siguen gratis de por vida si te mantienes dentro
de los límites (típicamente 2 OCPU / 12 GB o, en cuentas antiguas, hasta
4 / 24 GB). Hay que registrar una tarjeta, pero no se cobra si no sales
del Always Free.

## 1. Crear la VM

1. Cuenta en https://cloud.oracle.com (Free Tier).
2. Compute → Create instance.
3. Shape **VM.Standard.A1.Flex** (Ampere ARM). Si sale “Out of capacity”,
   cambia de availability domain o reintenta más tarde; alternativa
   Always Free x86: **VM.Standard.E2.Micro**.
4. Imagen: Ubuntu 22.04 o 24.04.
5. Sube tu clave SSH.
6. En la VCN, abre ingress **80** y **443** (y 22 solo desde tu IP).

## 2. En el servidor

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu
# cierra sesión SSH y vuelve a entrar
```

Clona el repo y copia variables:

```bash
git clone <tu-repo> inmob && cd inmob
cp apps/api/.env.example .env.prod
```

Edita `.env.prod` (mínimo):

```
DOMAIN=tudominio.com
WEB_BASE_URL=https://tudominio.com
CORS_ORIGINS=https://tudominio.com
NEXT_PUBLIC_API_BASE_URL=https://tudominio.com/api/v1
JWT_SECRET=<cadena larga aleatoria>
BROKER_EMAIL=tu@correo.com
BROKER_PASSWORD=<mínimo 8 caracteres>
BROKER_DEFAULT_NAME=ValleCaro Inmobiliaria
DB_PASSWORD=<otra cadena>
GOOGLE_MAPS_SERVER_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY=
```

Arranque:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Caddy obtiene HTTPS con Let’s Encrypt si `DOMAIN` apunta a la IP pública
(registro A en tu DNS). En localhost no hay certificado automático útil;
usa HTTP.

## 3. Primer uso

1. Abre `https://tudominio.com`.
2. Entra a `/admin/login` con `BROKER_EMAIL` / `BROKER_PASSWORD`.
3. Ve a **Ajustes**: logo, foto, WhatsApp (`58` + número sin ceros),
   centro del mapa (ya viene San Cristóbal).
4. Crea propiedades y publícalas. El catálogo público solo muestra
   publicadas.

## 4. Para venderlo a otro broker

Nueva VM (o mismo Compose con otro `DOMAIN`) + `.env.prod` distinto +
ajustes en `/admin/ajustes`. No hace falta fork.

## Notas

- Fotos: volumen `media_data`. Haz backup de ese volumen y de MariaDB.
- Si Ampere no está disponible en tu región home, espera o usa E2.Micro
  (1 GB RAM: aprieta memoria; prioriza Ampere).
- Google Maps: sin clave el sitio funciona, sin mapa. Restringe la clave
  de navegador a tu dominio.
