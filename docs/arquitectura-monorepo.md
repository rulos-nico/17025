# Arquitectura Monorepo - Laboratorio ISO 17025

## 📂 Estructura del Proyecto

```
lab-iso17025-monorepo/
├── apps/
│   └── frontend/              ← Aplicación React
│       ├── src/
│       │   ├── components/    ← Componentes React
│       │   ├── pages/         ← Páginas de la aplicación
│       │   ├── context/       ← Context API (Auth)
│       │   ├── services/      ← Servicios API
│       │   ├── config/        ← Configuraciones
│       │   └── styles/        ← Estilos globales
│       ├── index.html
│       ├── vite.config.js
│       └── package.json
│
├── packages/
│   ├── iso17025-utils/        ← Utilidades del laboratorio
│   │   ├── index.js
│   │   ├── validations.js     ← Validaciones de datos
│   │   ├── calculations.js    ← Cálculos estadísticos
│   │   └── package.json
│   │
│   └── shared-types/          ← Tipos y constantes compartidos
│       ├── index.js
│       ├── enums.js           ← Enumeraciones
│       ├── constants.js       ← Constantes del sistema
│       └── package.json
│
├── docs/                      ← Documentación
│   ├── README.md
│   ├── arquitectura-monorepo.md
│   ├── integracion-google-drive.md
│   └── sistema-permisos-roles.md
│
├── pnpm-workspace.yaml        ← Configuración del workspace
├── package.json               ← Scripts del monorepo
└── .gitignore

```

## 🎯 Paquetes Compartidos

### **@lab17025/iso17025-utils**
Utilidades y funciones reutilizables para cálculos de laboratorio.

**Funciones disponibles:**
- `validarCodigoMuestra(codigo)` - Valida formato de código de muestra
- `validarRangoTemperatura(temp, min, max)` - Valida rangos de temperatura
- `calcularDesviacionEstandar(valores)` - Calcula desviación estándar
- `calcularIncertidumbre(mediciones, k)` - Calcula incertidumbre expandida
- `calcularPromedio(valores)` - Calcula promedio
- `verificarEspecificacion(valor, min, max)` - Verifica límites

**Uso:**
```javascript
import { validarCodigoMuestra, calcularIncertidumbre } from '@lab17025/iso17025-utils'

const esValido = validarCodigoMuestra('LAB-2025-001')
const incertidumbre = calcularIncertidumbre([25.1, 25.3, 25.2, 25.0])
```

### **@lab17025/shared-types**
Enumeraciones, constantes y tipos compartidos entre frontend y backend.

**Contenido:**
- `ROLES` - Roles de usuario del sistema
- `ESTADOS_ENTREGABLE` - Estados de entregables
- `ESTADOS_MUESTRA` - Estados de muestras
- `TIPOS_ENSAYO` - Tipos de ensayos disponibles
- `MENSAJES_ERROR` - Mensajes de error estandarizados
- `RUTAS_API` - Rutas de endpoints de la API

**Uso:**
```javascript
import { ROLES, ESTADOS_ENTREGABLE, MENSAJES_ERROR } from '@lab17025/shared-types'

if (usuario.rol === ROLES.RESPONSABLE_TECNICO) {
  // ...
}
```

## 🚀 Scripts Disponibles

### En la raíz del proyecto:

```bash
# Desarrollo
pnpm dev              # Inicia solo el frontend
pnpm dev:all          # Inicia todas las apps en paralelo

# Build
pnpm build            # Construye todos los paquetes y apps
pnpm build:frontend   # Construye solo el frontend

# Utilidades
pnpm preview          # Preview del build del frontend
pnpm lint             # Linting en todos los paquetes
pnpm clean            # Limpia node_modules y dist
```

### En apps/frontend:

```bash
cd apps/frontend
pnpm dev              # Servidor de desarrollo
pnpm build            # Build de producción
pnpm preview          # Preview del build
```

## 📦 Agregar Dependencias

### Dependencia para el frontend:
```bash
pnpm --filter @lab17025/frontend add nombre-paquete
```

### Dependencia para un paquete:
```bash
pnpm --filter @lab17025/iso17025-utils add nombre-paquete
```

### Usar un paquete del workspace en frontend:
```bash
# En apps/frontend/package.json agregar:
{
  "dependencies": {
    "@lab17025/iso17025-utils": "workspace:*",
    "@lab17025/shared-types": "workspace:*"
  }
}

# Luego:
pnpm install
```

## 🔄 Flujo de Desarrollo

### 1. Modificar un paquete compartido
```bash
# Editar packages/iso17025-utils/calculations.js
# Los cambios se reflejan automáticamente en todas las apps que lo usan
```

### 2. Agregar nueva funcionalidad
```bash
# Si es código compartido → Agregar a packages/
# Si es específico de frontend → Agregar a apps/frontend/src/
```

### 3. Crear nuevo paquete
```bash
mkdir packages/nuevo-paquete
cd packages/nuevo-paquete
pnpm init
# Editar package.json con nombre @lab17025/nuevo-paquete
```

## 🎨 Ventajas del Monorepo

✅ **Código compartido sin publicar** - Los paquetes están disponibles localmente  
✅ **Refactorización atómica** - Cambia API y frontend en un solo commit  
✅ **Dependencias unificadas** - Una sola versión de React, etc.  
✅ **Builds más rápidos** - pnpm cachea y reutiliza dependencias  
✅ **Desarrollo simplificado** - Todo el código en un lugar  

## 🔮 Próximos Pasos

### Backend (Futuro)
Cuando se agregue el backend, la estructura será:

```
apps/
├── frontend/
└── backend/           ← Nueva aplicación Node.js/Express
    ├── src/
    │   ├── routes/
    │   ├── controllers/
    │   ├── models/
    │   └── middleware/
    ├── package.json
    └── .env
```

### Paquetes Adicionales Sugeridos

```
packages/
├── iso17025-utils/      ✅ Creado
├── shared-types/        ✅ Creado
├── api-client/          🔜 Cliente HTTP para consumir API
├── google-drive-client/ 🔜 Servicio Drive reutilizable
├── report-generator/    🔜 Generador de PDFs
└── validation-schemas/  🔜 Esquemas de validación Zod/Yup
```

## 📝 Convenciones

### Nombres de paquetes
- Usar scope `@lab17025/`
- Minúsculas con guiones: `@lab17025/iso17025-utils`

### Versiones
- Todos los paquetes internos usan `workspace:*`
- Mantener sincronizadas las versiones de dependencias externas

### Exports
- Usar named exports preferentemente
- Proporcionar un index.js como punto de entrada principal

---

**Última actualización**: 19 de Diciembre, 2025  
**Versión**: 1.0.0
