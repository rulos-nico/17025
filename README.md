# Plataforma de Entregables - Laboratorio ISO 17025

Plataforma web para gestión de entregables de un laboratorio de ensayos acreditado bajo la norma ISO/IEC 17025.

## 📋 Características

- **Gestión de Entregables**: Crear, editar y seguimiento de entregables
- **Gestión de Muestras**: Control y trazabilidad de muestras
- **Informes de Ensayo**: Generación y gestión de informes técnicos
- **Control de Calidad**: Seguimiento de requisitos ISO 17025
- **Gestión de Clientes**: Base de datos de clientes y contactos
- **Panel de Control**: Dashboard con métricas y estadísticas
- **Usuarios y Permisos**: Control de acceso según roles

## 🚀 Instalación

### Requisitos previos
- Node.js (v18 o superior)
- pnpm (v8 o superior)

### Instalación de pnpm
```bash
npm install -g pnpm
```

### Instalar dependencias
```bash
pnpm install
```

## 💻 Desarrollo

### Iniciar servidor de desarrollo
```bash
pnpm dev
```

El servidor se iniciará en `http://localhost:3000`

### Construir para producción
```bash
pnpm build
```

### Vista previa de producción
```bash
pnpm preview
```

## 📁 Estructura del Proyecto

```
├── public/             # Archivos estáticos
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Páginas principales
│   ├── config/         # Configuraciones (Google Drive, etc.)
│   ├── context/        # Context API para estado global
│   ├── services/       # Servicios API y Google Drive
│   ├── utils/          # Utilidades y helpers
│   ├── hooks/          # Custom hooks
│   ├── styles/         # Estilos globales
│   ├── App.jsx         # Componente principal
│   └── main.jsx        # Punto de entrada
├── .env.example        # Ejemplo de variables de entorno
├── index.html
├── vite.config.js
└── package.json
```

## 🔧 Tecnologías

- **React 18**: Framework UI
- **Vite**: Build tool y dev server
- **React Router**: Navegación
- **Zustand**: Estado global
- **Axios**: Cliente HTTP
- **date-fns**: Manejo de fechas
- **Google Drive API**: Almacenamiento de plantillas y documentación

## 🔑 Configuración de Google Drive

### 1. Crear proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Activa la API de Google Drive
4. Crea credenciales (API Key y OAuth 2.0 Client ID)

### 2. Configurar variables de entorno
1. Copia el archivo `.env.example` a `.env.local`
2. Completa las credenciales de Google Drive:
```bash
VITE_GOOGLE_API_KEY=tu_api_key
VITE_GOOGLE_CLIENT_ID=tu_client_id
```

### 3. Organizar carpetas en Google Drive
Crea las siguientes carpetas en tu Google Drive y copia sus IDs:
- **Plantillas de Informes**: Para plantillas de documentos
- **Documentación del Sistema**: Manuales y guías
- **Manuales de Calidad**: Documentos ISO 17025
- **Procedimientos**: Procedimientos operativos estándar

Agrega los IDs de las carpetas en `.env.local`:
```bash
VITE_DRIVE_FOLDER_PLANTILLAS=id_carpeta
VITE_DRIVE_FOLDER_DOCS=id_carpeta
VITE_DRIVE_FOLDER_CALIDAD=id_carpeta
VITE_DRIVE_FOLDER_PROCEDIMIENTOS=id_carpeta
```

## 📝 Norma ISO/IEC 17025

Esta plataforma está diseñada considerando los requisitos de:
- Trazabilidad de muestras
- Control de documentos
- Registro de ensayos
- Gestión de calidad
- Competencia del personal
- Validación de métodos

## 👥 Roles de Usuario

- **Administrador**: Acceso total al sistema
- **Responsable Técnico**: Gestión de ensayos y reportes
- **Analista**: Registro de ensayos
- **Cliente**: Visualización de entregables propios

## � Documentación

La documentación técnica completa se encuentra en la carpeta [`/docs`](./docs):
- [**Integración con Google Drive**](./docs/integracion-google-drive.md) - Guía completa de configuración
- [**Índice de Documentación**](./docs/README.md) - Acceso a toda la documentación

## �📄 Licencia

Propiedad privada del laboratorio.
