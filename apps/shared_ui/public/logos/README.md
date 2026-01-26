Coloca aquí los logos de la empresa.

Recomendación:
- `company-logo.svg` (optimizado, fondo transparente) — usado en la cabecera.
- `company-logo@2x.png` — versión de alta resolución si se necesita.

Cómo usar en el código:
- En `apps/shared_ui/src/App.jsx` reemplaza el SVG embebido por:
  <img src="/logos/company-logo.svg" alt="Nombre Empresa" className="logo-img" />

La carpeta `public/` se sirve estáticamente en Vite, por lo que las rutas comenzarán en `/`.
