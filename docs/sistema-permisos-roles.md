# Sistema de Gestión de Permisos y Roles

## 📋 Descripción General

Este documento explica cómo funciona el sistema de gestión de permisos y roles en la plataforma del laboratorio ISO 17025.

## 🎭 Roles Disponibles

### 1. **Administrador**
- Acceso completo a todas las funcionalidades
- Puede gestionar usuarios y sus roles
- Control total sobre configuraciones del sistema

### 2. **Responsable Técnico**
- Acceso a todas las funcionalidades operativas
- Puede gestionar entregables, muestras e informes
- Gestión de equipos, personal y cronograma
- No puede administrar usuarios del sistema

### 3. **Analista**
- Acceso limitado a funciones operativas
- Puede ver y editar entregables asignados
- Puede registrar muestras y ver informes
- No puede gestionar personal ni crear informes finales

### 4. **Cliente**
- Acceso muy limitado
- Solo puede ver sus propios entregables, muestras e informes
- No puede acceder a gestión interna del laboratorio

## 🔐 Arquitectura del Sistema

### 1. Contexto de Autenticación (`AuthContext.jsx`)

**Ubicación**: `src/context/AuthContext.jsx`

Este es el núcleo del sistema de permisos. Gestiona:
- **Estado del usuario**: Información del usuario actual y su rol
- **Matriz de permisos**: Define qué puede hacer cada rol
- **Métodos de autenticación**: Login, logout
- **Verificación de permisos**: Funciones para comprobar accesos

```javascript
// Ejemplo de uso
import { useAuth } from './context/AuthContext'

function MiComponente() {
  const { user, hasPermission, canAccess } = useAuth()
  
  // Verificar si puede crear entregables
  if (hasPermission('canCreateEntregables')) {
    // Mostrar botón de crear
  }
}
```

### 2. Componente de Rutas Protegidas (`ProtectedRoute.jsx`)

**Ubicación**: `src/components/ProtectedRoute/ProtectedRoute.jsx`

Envuelve las rutas que requieren permisos específicos:

```javascript
<Route path="equipos" element={
  <ProtectedRoute permission="canViewEquipos">
    <Equipos />
  </ProtectedRoute>
} />
```

**Funcionamiento:**
1. Verifica si el usuario está autenticado
2. Comprueba si tiene el permiso requerido
3. Si no tiene permiso → Muestra mensaje de "Acceso Denegado"
4. Si no está autenticado → Redirige al login

### 3. Menú Lateral Dinámico (`Sidebar.jsx`)

**Ubicación**: `src/components/Sidebar/Sidebar.jsx`

El menú se filtra automáticamente según los permisos del usuario:

```javascript
const menuItems = allMenuItems.filter(item => 
  !item.permission || hasPermission(item.permission)
)
```

**Resultado:**
- Los clientes solo ven: Inicio, Entregables, Muestras, Informes
- Los analistas no ven: Personal, Usuarios
- Los administradores ven todo

## 📊 Matriz de Permisos

| Permiso | Administrador | Resp. Técnico | Analista | Cliente |
|---------|---------------|---------------|----------|---------|
| canViewDashboard | ✅ | ✅ | ✅ | ❌ |
| canViewEntregables | ✅ | ✅ | ✅ | ✅ (propios) |
| canCreateEntregables | ✅ | ✅ | ❌ | ❌ |
| canEditEntregables | ✅ | ✅ | ✅ (asignados) | ❌ |
| canDeleteEntregables | ✅ | ✅ | ❌ | ❌ |
| canViewMuestras | ✅ | ✅ | ✅ | ✅ (propias) |
| canCreateMuestras | ✅ | ✅ | ✅ | ❌ |
| canViewInformes | ✅ | ✅ | ✅ | ✅ (propios) |
| canCreateInformes | ✅ | ✅ | ❌ | ❌ |
| canViewClientes | ✅ | ✅ | ✅ | ❌ |
| canManageClientes | ✅ | ❌ | ❌ | ❌ |
| canViewEquipos | ✅ | ✅ | ✅ | ❌ |
| canManageEquipos | ✅ | ✅ | ❌ | ❌ |
| canViewCronograma | ✅ | ✅ | ✅ | ❌ |
| canManageCronograma | ✅ | ✅ | ❌ | ❌ |
| canViewPersonal | ✅ | ✅ | ❌ | ❌ |
| canManagePersonal | ✅ | ✅ | ❌ | ❌ |
| canViewCalidad | ✅ | ✅ | ✅ | ❌ |
| canManageCalidad | ✅ | ✅ | ❌ | ❌ |
| canViewPlantillas | ✅ | ✅ | ✅ | ❌ |
| canManageUsuarios | ✅ | ❌ | ❌ | ❌ |

## 🛠️ Implementación Práctica

### Proteger una Ruta Completa

```javascript
// En App.jsx
<Route path="equipos" element={
  <ProtectedRoute permission="canViewEquipos">
    <Equipos />
  </ProtectedRoute>
} />
```

### Mostrar/Ocultar Botones según Permisos

```javascript
// En cualquier componente
import { useAuth } from '../context/AuthContext'

function MiComponente() {
  const { hasPermission } = useAuth()
  
  return (
    <div>
      {hasPermission('canCreateEntregables') && (
        <button className="btn btn-primary">
          Crear Entregable
        </button>
      )}
    </div>
  )
}
```

### Contenido Condicional por Rol

```javascript
// En Home.jsx
const { user } = useAuth()

{user.rol === 'Responsable Técnico' && (
  <div>
    {/* Contenido exclusivo para Responsable Técnico */}
  </div>
)}
```

### Verificar Múltiples Permisos

```javascript
const { hasPermission } = useAuth()

const canFullyManage = 
  hasPermission('canEditEntregables') && 
  hasPermission('canDeleteEntregables')
```

## 🔧 Herramienta de Desarrollo: Selector de Roles

**Ubicación**: `src/components/RoleSelector/RoleSelector.jsx`

En modo desarrollo, aparece un selector flotante en la esquina inferior derecha que permite:
- Cambiar entre roles en tiempo real
- Probar la aplicación desde la perspectiva de diferentes usuarios
- Ver qué elementos del menú se muestran/ocultan

**⚠️ IMPORTANTE**: Remover este componente en producción por seguridad.

```javascript
// Para desactivar en producción, en App.jsx:
{import.meta.env.DEV && <RoleSelector />}
```

## 🔄 Flujo de Autenticación

### 1. Carga Inicial
```
Usuario → App carga → AuthProvider inicializa
                   → Lee user de localStorage
                   → Si existe: carga usuario
                   → Si no existe: usuario por defecto (desarrollo)
```

### 2. Login (A implementar con backend)
```
Usuario → Formulario Login → Envía credenciales al backend
                           → Backend valida y retorna token + datos usuario
                           → AuthProvider guarda en estado y localStorage
                           → Redirige a Home
```

### 3. Verificación de Permisos en Cada Navegación
```
Usuario → Intenta acceder a ruta → ProtectedRoute verifica
                                 → Consulta AuthContext
                                 → Si tiene permiso: Muestra componente
                                 → Si no: Mensaje de acceso denegado
```

### 4. Logout
```
Usuario → Clic en Logout → AuthProvider limpia estado
                        → Elimina de localStorage
                        → Redirige a Login
```

## 📝 Agregar Nuevos Permisos

### Paso 1: Definir el Permiso
```javascript
// En AuthContext.jsx, agregar a PERMISSIONS
const PERMISSIONS = {
  [ROLES.ADMINISTRADOR]: {
    // ... permisos existentes
    canExportData: true,  // Nuevo permiso
  },
  [ROLES.RESPONSABLE_TECNICO]: {
    // ... permisos existentes
    canExportData: true,
  },
  // ... otros roles
}
```

### Paso 2: Usar el Permiso
```javascript
// En cualquier componente
{hasPermission('canExportData') && (
  <button>Exportar Datos</button>
)}
```

### Paso 3: Proteger Rutas (si aplica)
```javascript
<Route path="export" element={
  <ProtectedRoute permission="canExportData">
    <ExportPage />
  </ProtectedRoute>
} />
```

## 🚀 Integración con Backend (Próximamente)

Para conectar con un backend real:

### 1. Modificar AuthContext
```javascript
const login = async (email, password) => {
  try {
    const response = await axios.post('/api/auth/login', { email, password })
    const { token, user } = response.data
    
    // Guardar token
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    
    setUser(user)
    return true
  } catch (error) {
    console.error('Error de autenticación:', error)
    return false
  }
}
```

### 2. Agregar Interceptor de Axios
```javascript
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 3. Verificar Token en Cada Carga
```javascript
useEffect(() => {
  const verifyToken = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await axios.get('/api/auth/verify')
        setUser(response.data.user)
      } catch (error) {
        logout()
      }
    }
    setIsLoading(false)
  }
  
  verifyToken()
}, [])
```

## 🔒 Consideraciones de Seguridad

### ✅ Buenas Prácticas Implementadas
1. **Verificación en Frontend y Backend**: Los permisos del frontend son UX, el backend debe validar todo
2. **No exponer información sensible**: El cliente solo recibe los permisos que necesita
3. **Rutas protegidas**: Previene navegación directa sin permisos
4. **Token seguro**: Almacenado en localStorage (considerar httpOnly cookies en producción)

### ⚠️ A Implementar en Producción
1. **Refresh tokens**: Para mantener sesión activa
2. **Expiración de tokens**: Logout automático después de inactividad
3. **HTTPS obligatorio**: Toda comunicación encriptada
4. **Rate limiting**: Prevenir ataques de fuerza bruta
5. **Auditoría de accesos**: Registrar quién accede a qué y cuándo

## 📞 Preguntas Frecuentes

### ¿Cómo cambio el rol de un usuario?
**Desarrollo**: Usa el RoleSelector flotante
**Producción**: Solo administradores desde la página de Usuarios

### ¿Puedo tener permisos personalizados por usuario?
Sí, se puede extender el sistema:
```javascript
// Agregar permisos personalizados al usuario
user.customPermissions = ['canAccessSpecialReport']

// Verificar
const hasAccess = user.customPermissions.includes('canAccessSpecialReport')
```

### ¿Cómo restringir acceso a registros específicos?
```javascript
// En el componente
const { user } = useAuth()

// Filtrar solo entregables del cliente
const entregables = todosLosEntregables.filter(e => 
  user.rol === 'Cliente' ? e.clienteId === user.id : true
)
```

---

**Última actualización**: 17 de Diciembre, 2025  
**Versión del documento**: 1.0  
**Autor**: Sistema de Gestión Laboratorio ISO 17025
