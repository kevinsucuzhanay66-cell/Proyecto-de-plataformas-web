# New Era Tech · E‑commerce estático (con backend opcional)

## 1) Estructura
- `index.html`, `productos.html`, `producto.html`, `carrito.html`, `contacto.html`, `nosotros.html`, `envios.html`
- `data/productos.json` — catálogo en JSON (migrable a BD/API)
- `scripts/app.js` — render dinámico, filtros avanzados, carrito, detalle, contacto
- `server/index.js` — **opcional**: guarda contactos en `data/contactos.txt`
- `styles/styles.css` — mobile-first, Grid+Flex, dark-friendly

## 2) Ejecutar localmente con guardado en archivo
Requisitos: Node 18+
```bash
npm install
npm start
# abre http://localhost:5174
# ve a /contacto y cambia window.BACKEND = true (en contacto.html) si deseas usar el backend
```
Los mensajes se guardan en `data/contactos.txt` (TSV).

## 3) Subir a hosting gratuito (solo estático)
- Sube todo el proyecto salvo la carpeta `server/`. El formulario guardará en **localStorage** y te permitirá **Exportar TXT**.
- Si quieres guardar en servidor gratis: usa funciones serverless (Netlify/Vercel) — te puedo pasar la función si la necesitas.

## 4) Personalización rápida
- Cambia textos del `index.html` (hero y CTA).
- Reemplaza imágenes de `assets/images/` por fotos reales.
- Ajusta `productos.json` con tu catálogo real (mismas claves).

## 5) Rutas
Usamos rutas relativas (`./...`) compatibles con GitHub Pages, Netlify, Vercel y Cloudflare Pages.