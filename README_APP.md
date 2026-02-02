# LabMat17025 - Aplicación Web del Laboratorio

Aplicación web pública para laboratorio de materiales acreditado bajo norma ISO/IEC 17025:2017.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias (ya hecho)
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## 📁 Estructura del Proyecto

```
shared_ui/
├── src/
│   ├── config.js          # Configuración centralizada (API, constantes)
│   ├── App.jsx            # Componente principal con navegación
│   ├── App.css            # Estilos globales
│   ├── main.jsx           # Punto de entrada
│   └── pages/
│       └── Home.jsx       # Página principal (landing)
├── .env.example           # Plantilla de variables de entorno
└── package.json           # Dependencias
```

## ⚙️ Configuración

### Variables de Entorno (.env)

Crea un archivo `.env` basado en `.env.example`:

```env
# URL del backend (tu API Express)
VITE_API_URL=http://localhost:3000

# Timeout de peticiones (ms)
VITE_API_TIMEOUT=10000

# Nombre de la aplicación
VITE_APP_NAME=LabMat17025

# Entorno (development/production)
VITE_APP_ENV=development

# Información de contacto
VITE_CONTACT_EMAIL=contacto@labmat17025.com
VITE_CONTACT_PHONE=+123 456 7890
```

### Configuración Centralizada (src/config.js)

Todas las configuraciones están en `src/config.js`:

- **API_CONFIG**: Endpoints del backend
- **APP_CONFIG**: Configuración de la aplicación
- **CONTACT_INFO**: Información de contacto
- **SERVICES**: Lista de servicios del laboratorio
- **NAV_ITEMS**: Items de navegación
- **STATS**: Estadísticas del hero

## 🔌 Integración con Backend

### Ejemplo de Consumo de API

El formulario de contacto ya está configurado para enviar datos al backend:

```javascript
// En src/pages/Home.jsx
const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.contact.send}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(formData),
});
```

### Endpoints Configurados (detallado)

En `src/config.js` están definidas las rutas que el frontend consume. A continuación se listan, con método(s) esperados, uso previsto, qué partes del frontend las usan y una sugerencia de dónde implementarlas en el backend (si aún no existen).

- **Auth**
  - `POST /api/auth/login` — Inicio de sesión (recibe credenciales, devuelve token / sesión). Consumido por: autenticación/login (pendiente de implementarse). Backend sugerido: `server/routes/auth.js`.
  - `POST /api/auth/logout` — Cerrar sesión. Consumido por: botón de logout en `src/App.jsx`. Backend sugerido: `server/routes/auth.js`.
  - `GET /api/auth/profile`, `POST /api/auth/refresh` — Perfil y refresh token (opcional).

- **Ensayos**
  - `GET /api/ensayos` — Listado de ensayos. Consumido por: `src/pages/Ensayo.jsx`, `src/pages/Home.jsx` (pendientes). Backend: `server/routes/ensayos.js`.
  - `POST /api/ensayos` — Crear nuevo ensayo. Uso: formulario de creación.
  - `GET/PUT/DELETE /api/ensayos/:id` — Detalle, actualización y borrado de un ensayo.
  - `PUT /api/ensayos/:id/status` — Actualizar estado (pendiente → en_proceso → completado).
  - `POST /api/ensayos/:id/asignar` — Asignar técnico/responsable.

- **Clientes**
  - `GET /api/clientes` — Listado de clientes. Consumido por: `src/pages/Clientes.jsx`.
  - `POST /api/clientes` — Crear cliente.
  - `GET/PUT/DELETE /api/clientes/:id` — Operaciones sobre cliente.
  - `GET /api/clientes/:id/ensayos` — Ensayos de un cliente.
  - Backend sugerido: `server/routes/clientes.js`.

- **Reportes**
  - `GET /api/reportes` — Listado de reportes / entregables. Consumido por: `src/pages/Reportes.jsx` (cronograma y listados).
  - `POST /api/reportes` — Crear/registrar reporte.
  - `GET /api/reportes/:id` — Detalle de reporte.
  - `GET /api/reportes/:id/download` — Descargar PDF/entregable.
  - `POST /api/reportes/:id/upload` — Subir archivos asociados.
  - `POST /api/reportes/:id/aprobar` — Aprobar reporte (workflow).
  - Backend sugerido: `server/routes/reportes.js`.

- **Usuarios / Personal**
  - `GET /api/usuarios` — Listado de usuarios.
  - `POST /api/usuarios` — Crear usuario.
  - `GET/PUT/DELETE /api/usuarios/:id` — Operaciones sobre usuario.
  - Backend sugerido: `server/routes/usuarios.js`.

- **Dashboard**
  - `GET /api/dashboard/stats` — Estadísticas para el dashboard (cuentas, totales).
  - `GET /api/dashboard/pendientes` — Ensayos pendientes.
  - `GET /api/dashboard/recientes` — Actividad reciente.
  - Consumido por: `src/pages/Home.jsx`.
  - Backend sugerido: `server/routes/dashboard.js`.

- **Equipos**
  - `GET /api/equipos` — Listado de equipos y estado.
  - `GET /api/equipos/:id` — Detalle de equipo.
  - `POST /api/equipos/:id/calibracion` — Registrar calibración / mantenimiento.
  - Backend sugerido: `server/routes/equipos.js`.

- **Contacto / Formularios**
  - `POST /api/contacto` — Envío de formulario de contacto (web). Consumido por: formulario en `src/pages/Home.jsx`.
  - `POST /api/contacto/cotizacion` — Solicitud de cotización.
  - Backend sugerido: `server/routes/contacto.js`.

- **Otras (ejemplo)**
  - `GET /api/nueva-seccion` — Ejemplo en README para añadir nuevas secciones.

Notas:

- Ubicación frontend: las rutas están en `apps/shared_ui/src/config.js` (variable `API_CONFIG.endpoints`). El frontend hace fetch a `API_CONFIG.baseURL + endpoint`.
- Implementación backend sugerida: crea la carpeta `server/` o `backend/` en la raíz y añade archivos por módulo (`routes/ensayos.js`, `routes/reportes.js`, etc.). Usa `express.Router()` y exporta las rutas. Registra las rutas en `index.js` con `app.use('/api/ensayos', ensayosRouter)`.
- Si no existe backend (o durante desarrollo), puedes usar mocks locales o JSON estático en `server/mocks/` y exponerlos con rutas simples.

Si quieres, puedo:

- Generar archivos de ejemplo para el backend con rutas mock (`/api/reportes`, `/api/ensayos`).
- Añadir ejemplos de request/response JSON para cada endpoint.

Indícame cuál prefieres y lo implemento.

## 🎨 Personalización

### Colores

Modifica las variables CSS en `src/App.css`:

```css
:root {
  --primary: #0066cc;
  --primary-dark: #0052a3;
  --text-primary: #1a202c;
  /* ... más colores */
}
```

### Servicios

Edita el array `SERVICES` en `src/config.js`:

```javascript
export const SERVICES = [
  {
    id: 'mecanicos',
    title: 'Ensayos Mecánicos',
    description: 'Descripción del servicio',
    tests: ['Test 1', 'Test 2', ...]
  },
  // ... más servicios
]
```

### Información de Contacto

Actualiza `CONTACT_INFO` en `src/config.js` o usa variables de entorno:

```javascript
export const CONTACT_INFO = {
  email: import.meta.env.VITE_CONTACT_EMAIL,
  phone: import.meta.env.VITE_CONTACT_PHONE,
  address: 'Tu dirección',
  // ...
}
```

## 📱 Responsive

La aplicación es completamente responsive con breakpoints en:
- Desktop: > 768px
- Tablet: 768px - 480px
- Mobile: < 480px

## 🔐 Producción

### Build

```bash
npm run build
```

Genera una carpeta `dist/` lista para desplegar.

### Variables de Entorno en Producción

Crea un archivo `.env.production`:

```env
VITE_API_URL=https://api.tudominio.com
VITE_APP_ENV=production
```

## 📚 Tecnologías

- **React 18**: Framework UI
- **Vite**: Build tool y dev server
- **CSS Modules**: Estilos con CSS puro
- **Fetch API**: Consumo de APIs REST

## 🛠️ Desarrollo

### Agregar un Nuevo Endpoint

1. Abre `src/config.js`
2. Agrega el endpoint en `API_CONFIG.endpoints`:
   ```javascript
   nuevaSeccion: {
     list: '/api/nueva-seccion',
   }
   ```

### Crear Nueva Sección

1. Agrega el componente en `src/pages/Home.jsx`
2. Agrega estilos en `src/App.css`
3. Agrega item de navegación en `NAV_ITEMS` en `config.js`

## 📝 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter
```

## 🤝 Integración Backend (Tu Parte)

### Endpoints Esperados

El frontend espera estos endpoints en tu backend:

1. **POST /api/contacto** - Enviar formulario de contacto
   ```json
   {
     "nombre": "string",
     "empresa": "string",
     "email": "string",
     "telefono": "string",
     "servicio": "string",
     "mensaje": "string",
     "acepto": boolean
   }
   ```

2. **GET /api/ensayos** - Lista de ensayos
3. **POST /api/auth/login** - Login de usuarios
4. **GET /api/reportes** - Lista de reportes

### CORS

Recuerda configurar CORS en tu backend Express:

```javascript
app.use(cors({
  origin: 'http://localhost:5173', // URL del frontend en desarrollo
  credentials: true
}));
```

## 📞 Soporte

Para modificar o agregar funcionalidades, revisa:
- `src/config.js` - Todas las configuraciones
- `src/pages/Home.jsx` - Página principal
- `src/App.css` - Estilos globales

---

**Versión**: 1.0.0  
**Norma**: ISO/IEC 17025:2017
