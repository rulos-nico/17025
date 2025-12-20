# Integración con Google Drive

## 📋 Descripción General

Este documento detalla el proceso completo de integración de Google Drive con la plataforma de entregables del laboratorio ISO 17025. La integración permite almacenar y gestionar plantillas de informes, manuales de calidad, procedimientos y documentación del sistema directamente desde Google Drive.

## 🎯 Objetivo

Utilizar Google Drive como repositorio centralizado para:
- **Plantillas de Informes**: Documentos Word/Excel para generar informes de ensayos
- **Manuales de Calidad**: Documentación ISO 17025
- **Procedimientos Operativos**: POEs del laboratorio
- **Documentación del Sistema**: Guías y manuales de usuario

## 🛠️ Componentes Implementados

### 1. Configuración (`src/config/googleDrive.js`)
Archivo de configuración centralizada que define:
- Credenciales de la API de Google Drive
- IDs de carpetas específicas
- Tipos MIME soportados
- Alcances (scopes) de permisos

```javascript
export const GOOGLE_DRIVE_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  scopes: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file'
}
```

### 2. Servicio (`src/services/googleDriveService.js`)
Servicio singleton que gestiona todas las operaciones con Google Drive:

**Métodos principales:**
- `initialize()`: Inicializa la API de Google Drive
- `signIn()`: Autentica al usuario
- `listFiles(folderId)`: Lista archivos de una carpeta
- `downloadFile(fileId, fileName)`: Descarga un archivo
- `uploadFile(file, folderId)`: Sube un archivo
- `createFromTemplate(templateId, newFileName)`: Crea documento desde plantilla
- `searchFiles(query)`: Busca archivos por nombre

**Métodos específicos por categoría:**
- `getPlantillasInformes()`: Obtiene plantillas de informes
- `getDocumentacionSistema()`: Obtiene documentación del sistema
- `getManualesCalidad()`: Obtiene manuales de calidad ISO 17025
- `getProcedimientos()`: Obtiene procedimientos operativos

### 3. Componente de UI (`src/pages/Plantillas/Plantillas.jsx`)
Interfaz de usuario para interactuar con los archivos de Google Drive:

**Características:**
- Autenticación OAuth 2.0 con Google
- Pestañas por categoría de documentos
- Listado de archivos con metadatos
- Previsualización en Google Drive
- Descarga de archivos
- Actualización manual de listados

## 📝 Pasos de Implementación

### Paso 1: Crear Proyecto en Google Cloud Console

1. Acceder a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto:
   - Nombre: `Laboratorio-ISO-17025`
   - ID del proyecto: (se genera automáticamente)
3. Seleccionar el proyecto recién creado

### Paso 2: Habilitar Google Drive API

1. En el menú lateral: **APIs y servicios** → **Biblioteca**
2. Buscar "Google Drive API"
3. Hacer clic en **Habilitar**

### Paso 3: Crear Credenciales

#### API Key:
1. **APIs y servicios** → **Credenciales**
2. Clic en **+ CREAR CREDENCIALES**
3. Seleccionar **Clave de API**
4. Copiar la clave generada
5. (Opcional) Restringir la clave:
   - Restricciones de la API: Seleccionar "Google Drive API"

#### OAuth 2.0 Client ID:
1. **APIs y servicios** → **Credenciales**
2. Si es la primera vez, configurar **Pantalla de consentimiento de OAuth**:
   - Tipo de usuario: **Externo**
   - Nombre de la aplicación: `Laboratorio ISO 17025`
   - Email de asistencia: tu email
   - Ámbitos: Agregar `../auth/drive.readonly` y `../auth/drive.file`
3. **+ CREAR CREDENCIALES** → **ID de cliente de OAuth 2.0**
4. Tipo de aplicación: **Aplicación web**
5. Orígenes autorizados de JavaScript:
   ```
   http://localhost:3000
   http://localhost:5173
   ```
6. URI de redirección autorizados:
   ```
   http://localhost:3000
   http://localhost:5173
   ```
7. Copiar el **ID de cliente**

### Paso 4: Organizar Google Drive

Crear la siguiente estructura de carpetas en Google Drive:

```
📁 Laboratorio ISO 17025/
├── 📁 Plantillas de Informes/
│   ├── Plantilla_Informe_Fisicoquimico.docx
│   ├── Plantilla_Informe_Microbiologico.docx
│   └── Plantilla_Certificado_Calibracion.xlsx
├── 📁 Manuales de Calidad/
│   ├── Manual_Calidad_ISO17025.pdf
│   ├── Politica_Calidad.pdf
│   └── Objetivos_Calidad.pdf
├── 📁 Procedimientos/
│   ├── POE_001_Recepcion_Muestras.pdf
│   ├── POE_002_Toma_Muestras.pdf
│   └── POE_003_Analisis_Fisicoquimico.pdf
└── 📁 Documentación del Sistema/
    ├── Manual_Usuario.pdf
    ├── Guia_Instalacion.pdf
    └── FAQ.pdf
```

**Obtener IDs de carpetas:**
1. Abrir cada carpeta en Google Drive
2. La URL tendrá el formato: `https://drive.google.com/drive/folders/ID_DE_CARPETA`
3. Copiar el `ID_DE_CARPETA` (la parte después de `/folders/`)

### Paso 5: Configurar Variables de Entorno

1. Copiar `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Editar `.env.local` con las credenciales:
   ```env
   # Google Drive API
   VITE_GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   
   # IDs de carpetas en Google Drive
   VITE_DRIVE_FOLDER_PLANTILLAS=1AbCdEfGhIjKlMnOpQrStUvWxYz
   VITE_DRIVE_FOLDER_DOCS=2BcDeFgHiJkLmNoPqRsTuVwXyZa
   VITE_DRIVE_FOLDER_CALIDAD=3CdEfGhIjKlMnOpQrStUvWxYzAb
   VITE_DRIVE_FOLDER_PROCEDIMIENTOS=4DeFgHiJkLmNoPqRsTuVwXyZaBc
   ```

### Paso 6: Instalar Dependencias

Las dependencias ya están incluidas en `package.json`, pero si necesitas reinstalar:

```bash
pnpm install
```

### Paso 7: Iniciar la Aplicación

```bash
pnpm dev
```

La aplicación se abrirá en `http://localhost:3000`

## 🔐 Flujo de Autenticación

### 1. Primera vez que el usuario accede:
```
Usuario → Clic "Conectar con Google Drive" 
       → Ventana OAuth de Google
       → Usuario selecciona cuenta
       → Autoriza permisos
       → Token guardado en sesión
       → Acceso a archivos
```

### 2. Sesiones posteriores:
```
Usuario → Accede a Plantillas
       → Sistema verifica token
       → Si es válido: Acceso directo
       → Si expiró: Re-autenticación
```

## 📊 Tipos de Archivos Soportados

| Tipo | MIME Type | Icono | Acciones |
|------|-----------|-------|----------|
| Google Docs | `application/vnd.google-apps.document` | 📝 | Ver, Descargar (PDF/DOCX) |
| Google Sheets | `application/vnd.google-apps.spreadsheet` | 📊 | Ver, Descargar (XLSX) |
| Microsoft Word | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 📝 | Ver, Descargar |
| Microsoft Excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | 📊 | Ver, Descargar |
| PDF | `application/pdf` | 📄 | Ver, Descargar |
| Presentaciones | `application/vnd.google-apps.presentation` | 📽️ | Ver, Descargar |

## 🔄 Casos de Uso

### Caso 1: Consultar Plantilla de Informe
```
Usuario → Plantillas & Docs
       → Pestaña "Plantillas de Informes"
       → Busca "Plantilla_Informe_Fisicoquimico"
       → Clic "Ver" (abre en Drive)
       → Revisa formato
```

### Caso 2: Descargar Manual de Calidad
```
Usuario → Plantillas & Docs
       → Pestaña "Manuales de Calidad"
       → Localiza "Manual_Calidad_ISO17025.pdf"
       → Clic "Descargar"
       → Archivo guardado localmente
```

### Caso 3: Generar Informe desde Plantilla
```
Usuario → Entregables
       → Crear Nuevo Entregable
       → Selecciona plantilla desde Drive
       → Sistema copia plantilla
       → Completa datos del ensayo
       → Genera informe personalizado
```

## ⚠️ Consideraciones de Seguridad

### Tokens de Acceso
- Los tokens se almacenan en memoria (no en localStorage por seguridad)
- Expiran después de 1 hora
- Re-autenticación automática al expirar

### Permisos OAuth
- **drive.readonly**: Solo lectura de archivos
- **drive.file**: Crear/modificar archivos creados por la app
- NO se solicita acceso completo a Drive

### Variables de Entorno
- `.env.local` NO debe subirse a Git
- Incluido en `.gitignore`
- Cada desarrollador debe tener su propia configuración

## 🐛 Solución de Problemas

### Error: "Token has expired"
**Solución**: Cerrar sesión y volver a autenticar

### Error: "Files not found"
**Causa**: IDs de carpetas incorrectos en `.env.local`
**Solución**: Verificar IDs en Google Drive

### Error: "API Key not valid"
**Causa**: Restricciones de API Key muy estrictas
**Solución**: 
1. Google Cloud Console → Credenciales
2. Editar API Key
3. Relajar restricciones o agregar URLs permitidas

### Archivos no se listan
**Causa**: Permisos insuficientes en carpetas de Drive
**Solución**: 
1. Compartir carpetas con la cuenta del OAuth
2. Dar permisos de "Visor" mínimo

### CORS errors en desarrollo
**Solución**: 
1. Asegurar que `localhost:3000` esté en orígenes autorizados
2. Reiniciar servidor de desarrollo

## 📈 Futuras Mejoras

### Corto Plazo
- [ ] Caché de listados de archivos
- [ ] Paginación para carpetas grandes (>100 archivos)
- [ ] Filtros por tipo de archivo
- [ ] Búsqueda avanzada

### Mediano Plazo
- [ ] Preview de documentos en la app (sin abrir Drive)
- [ ] Edición en línea de Google Docs
- [ ] Versionado de documentos
- [ ] Comentarios y colaboración

### Largo Plazo
- [ ] Sincronización bidireccional
- [ ] Gestión de permisos por usuario
- [ ] Auditoría de acceso a documentos
- [ ] Integración con flujo de aprobación de documentos

## 📞 Soporte

Para problemas con la integración de Google Drive:
1. Revisar logs del navegador (F12 → Console)
2. Verificar configuración en `.env.local`
3. Consultar [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)

---

**Última actualización**: 17 de Diciembre, 2025
**Versión del documento**: 1.0
**Autor**: Sistema de Gestión Laboratorio ISO 17025
