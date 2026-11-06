# Aires Refugio Serrano — Landing

Landing page estática de Cabaña Algarrobos (Villa La Bolsa, Córdoba).

## Estructura
- `index.html` — la página (HTML + estilos + animaciones).
- `assets/` — fotos, logo, fuentes, runtime y React (servidos como archivos estáticos).
- `tools/unbundle.mjs` — convierte el export de Claude Design (HTML autodesempaquetable) en `index.html` + `assets/`.

## Actualizar desde un nuevo export de Claude Design
El export viene como un único HTML que se "desempaqueta" en el navegador (muestra una "A" y un cartel
"Unpacking..." antes del intro). No lo subas tal cual: convertilo primero.

```bash
node tools/unbundle.mjs ~/Downloads/export.html .
```

## Publicar en Vercel
1. Subí esta carpeta a un repositorio de GitHub.
2. En Vercel: **Add New → Project** → importá el repo.
3. Framework preset: **Other**. Sin build command ni output directory.
4. Deploy. Cada push a `main` vuelve a publicar automáticamente.

## Pendientes
- Número real de WhatsApp en el botón (`https://wa.me/549XXXXXXXXXX`).
- Confirmar capacidad, cochera y ropa blanca.
