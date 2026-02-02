# Plataforma de Entregables - Laboratorio ISO 17025

Plataforma web para gestión de entregables de un laboratorio de ensayos acreditado bajo la norma ISO/IEC 17025.

## Características

- **Gestión de Entregables**: Crear, editar y seguimiento de entregables
- **Gestión de Muestras**: Control y trazabilidad de muestras
- **Informes de Ensayo**: Generación y gestión de informes técnicos
- **Control de Calidad**: Seguimiento de requisitos ISO 17025
- **Gestión de Clientes**: Base de datos de clientes y contactos
- **Panel de Control**: Dashboard con métricas y estadísticas
- **Usuarios y Permisos**: Control de acceso según roles

## Requisitos

- Node.js v20 o superior
- npm v10 o superior
- Docker (opcional, para desarrollo con contenedores)

## Instalación

### Desarrollo local (sin Docker)

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Iniciar servidor de desarrollo
npm run dev

# Iniciar API mock (en otra terminal)
npm run api:dev
```

### Desarrollo con Docker

```bash
# Copiar variables de entorno
cp .env.example .env.local

# Iniciar contenedores (frontend + api-mock)
npm run docker:dev

# O con rebuild
npm run docker:dev:build
```

### URLs de desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API Mock | http://localhost:3000 |

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Ejecutar ESLint |
| `npm run api:dev` | Iniciar API mock |
| `npm run docker:dev` | Docker desarrollo |
| `npm run docker:dev:build` | Docker desarrollo (rebuild) |
| `npm run docker:prod` | Docker producción local |
| `npm run docker:down` | Detener contenedores |
| `npm run docker:clean` | Limpiar contenedores e imágenes |

## Estructura del Proyecto

```
├── docker/
│   ├── Dockerfile          # Build producción
│   ├── Dockerfile.dev      # Desarrollo con hot reload
│   ├── Dockerfile.api      # API mock
│   └── nginx/
│       └── nginx.conf      # Configuración servidor web
├── public/                 # Archivos estáticos
├── src/
│   ├── api/                # API mock (Express)
│   ├── assets/             # Imágenes, fuentes, etc.
│   ├── components/         # Componentes reutilizables
│   ├── examples/           # Datos de ejemplo/mock
│   ├── pages/              # Páginas principales
│   ├── App.jsx             # Componente principal
│   ├── App.css             # Estilos globales
│   ├── config.js           # Configuración centralizada
│   └── main.jsx            # Punto de entrada
├── .env.example            # Variables de entorno (template)
├── docker-compose.yml      # Orquestación Docker
├── index.html              # HTML principal
├── package.json
└── vite.config.js          # Configuración Vite
```

## Tecnologías

- **React 19**: Framework UI
- **Vite**: Build tool y dev server
- **Express**: API mock para desarrollo
- **Google Drive API**: Almacenamiento de plantillas y documentación

## Configuración de Google Drive

### 1. Crear proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Activa la API de Google Drive
4. Crea credenciales (API Key y OAuth 2.0 Client ID)

### 2. Configurar variables de entorno
Copia `.env.example` a `.env.local` y completa:
```bash
VITE_GOOGLE_API_KEY=tu_api_key
VITE_GOOGLE_CLIENT_ID=tu_client_id
VITE_DRIVE_FOLDER_PLANTILLAS=id_carpeta
VITE_DRIVE_FOLDER_DOCS=id_carpeta
VITE_DRIVE_FOLDER_CALIDAD=id_carpeta
VITE_DRIVE_FOLDER_PROCEDIMIENTOS=id_carpeta
```

## Norma ISO/IEC 17025

Esta plataforma está diseñada considerando los requisitos de:
- Trazabilidad de muestras
- Control de documentos
- Registro de ensayos
- Gestión de calidad
- Competencia del personal
- Validación de métodos

## Roles de Usuario

- **Administrador**: Acceso total al sistema
- **Responsable Técnico**: Gestión de ensayos y reportes
- **Analista**: Registro de ensayos
- **Cliente**: Visualización de entregables propios

## Licencia

Este software es propiedad privada. Todos los derechos reservados.

Consulta el archivo [LICENSE](./LICENSE) para más detalles.


## API
src/api/
├── Cargo.toml
└── src/
    ├── main.rs  #Arranque del servidor
    ├── config.rs #variables de entorno y Configuración
    ├── errors.rs #Manejo de reportes de reportes
    ├── routes/ # registro de endpoints
    │   ├── mod.rs # registro de rutas
    │   ├── proyectos.rs # endpoints de proyectos
    │   ├── ensayos.rs # endpoints de ensayos
    │   ├── clientes.rs # endpoints de clientes 
    │   ├── equipos.rs # endpoints de equipos 
    │   └── auth.rs # endpoints de autenticació
    ├── models/ # definición de estructuras de datos
    │   ├── mod.rs 
    │   ├── proyecto.rs # definición de proyecto
    │   ├── ensayo.rs # definición de ensayo
    │   ├── cliente.rs # definición de cliente
    │   └── equipo.rs # definición de equipo
    └── services/ # lógica de negocio
        ├── mod.rs # registro de Servicio
        ├── google_sheets.rs  # integración con Google google_sheets
        └── google_drive.rs # integración con Google Drive

