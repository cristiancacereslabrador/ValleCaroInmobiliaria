---
name: feedback-preview-access
description: Cómo prefiere el usuario ver una app corriendo en este servidor cuando no tiene acceso de red directo, sin SSH ni configuración de su lado
metadata:
  type: feedback
---

El usuario no quiere túneles SSH ni pasos de configuración de su lado para "ver" una app que corre en este servidor (`dashboard`) - solo quiere abrir algo en su navegador. `localhost:<puerto>` en sus mensajes se refiere a SU máquina, no a este servidor, así que nunca va a funcionar tal cual aunque el servidor esté sano.

**Por qué:** corrigió explícitamente el intento de darle un link `http://localhost:3002` (no le funcionó) y luego rechazó la opción de túnel SSH ("no se puede simplemente meterme en el navegador... sin conexiones de ssh ni nada complejo").

**Cómo aplicar:** cuando el usuario quiera "ver" algo que corre en un puerto local de este servidor sin acceso de red configurado:
1. Tomar capturas reales con un navegador headless (Puppeteer, instalado ad-hoc en el scratchpad, no en el proyecto) contra `localhost:<puerto>` desde DENTRO del servidor.
2. Publicar esas capturas embebidas en un Artifact (HTML con imágenes en base64) - eso sí les da una URL real de claude.ai que abren en cualquier navegador sin nada de su lado. Ver [[project_real_estate_mvp]] para el caso donde se usó.
3. Si además quieren interactividad real (clicks, formularios), la única vía sin SSH es publicar un Proxy Host en el Nginx Proxy Manager externo del servidor (ver `/var/www/html/CLAUDE.md` del host) - pero ese NPM es externo y el agente no tiene credenciales; hay que pedírselas al usuario o que lo configure él mismo.
