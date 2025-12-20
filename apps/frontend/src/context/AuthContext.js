import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Definición de roles y sus permisos
const ROLES = {
  ADMINISTRADOR: 'Administrador',
  RESPONSABLE_TECNICO: 'Responsable Técnico',
  ANALISTA: 'Analista',
  CLIENTE: 'Cliente'
}

// Matriz de permisos por rol
const PERMISSIONS = {
  [ROLES.ADMINISTRADOR]: {
    canViewDashboard: true,
    canViewEntregables: true,
    canCreateEntregables: true,
    canEditEntregables: true,
    canDeleteEntregables: true,
    canViewMuestras: true,
    canCreateMuestras: true,
    canViewInformes: true,
    canCreateInformes: true,
    canViewClientes: true,
    canManageClientes: true,
    canViewEquipos: true,
    canManageEquipos: true,
    canViewCronograma: true,
    canManageCronograma: true,
    canViewPersonal: true,
    canManagePersonal: true,
    canViewCalidad: true,
    canManageCalidad: true,
    canViewPlantillas: true,
    canManageUsuarios: true
  },
  [ROLES.RESPONSABLE_TECNICO]: {
    canViewDashboard: true,
    canViewEntregables: true,
    canCreateEntregables: true,
    canEditEntregables: true,
    canDeleteEntregables: true,
    canViewMuestras: true,
    canCreateMuestras: true,
    canViewInformes: true,
    canCreateInformes: true,
    canViewClientes: true,
    canManageClientes: false,
    canViewEquipos: true,
    canManageEquipos: true,
    canViewCronograma: true,
    canManageCronograma: true,
    canViewPersonal: true,
    canManagePersonal: true,
    canViewCalidad: true,
    canManageCalidad: true,
    canViewPlantillas: true,
    canManageUsuarios: false
  },
  [ROLES.ANALISTA]: {
    canViewDashboard: true,
    canViewEntregables: true,
    canCreateEntregables: false,
    canEditEntregables: true, // Solo los asignados
    canDeleteEntregables: false,
    canViewMuestras: true,
    canCreateMuestras: true,
    canViewInformes: true,
    canCreateInformes: false,
    canViewClientes: true,
    canManageClientes: false,
    canViewEquipos: true,
    canManageEquipos: false,
    canViewCronograma: true,
    canManageCronograma: false,
    canViewPersonal: false,
    canManagePersonal: false,
    canViewCalidad: true,
    canManageCalidad: false,
    canViewPlantillas: true,
    canManageUsuarios: false
  },
  [ROLES.CLIENTE]: {
    canViewDashboard: false,
    canViewEntregables: true, // Solo los propios
    canCreateEntregables: false,
    canEditEntregables: false,
    canDeleteEntregables: false,
    canViewMuestras: true, // Solo las propias
    canCreateMuestras: false,
    canViewInformes: true, // Solo los propios
    canCreateInformes: false,
    canViewClientes: false,
    canManageClientes: false,
    canViewEquipos: false,
    canManageEquipos: false,
    canViewCronograma: false,
    canManageCronograma: false,
    canViewPersonal: false,
    canManagePersonal: false,
    canViewCalidad: false,
    canManageCalidad: false,
    canViewPlantillas: false,
    canManageUsuarios: false
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular carga de usuario desde localStorage o API
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      // Usuario por defecto para desarrollo
      const defaultUser = {
        id: 1,
        nombre: 'Juan Delgado',
        email: 'juan.delgado@lab.com',
        rol: ROLES.RESPONSABLE_TECNICO,
        iniciales: 'JD'
      }
      setUser(defaultUser)
      localStorage.setItem('user', JSON.stringify(defaultUser))
    }
    setIsLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const hasPermission = (permission) => {
    if (!user) return false
    return PERMISSIONS[user.rol]?.[permission] || false
  }

  const canAccess = (requiredPermission) => {
    return hasPermission(requiredPermission)
  }

  const changeRole = (newRole) => {
    if (user) {
      const updatedUser = { ...user, rol: newRole }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    hasPermission,
    canAccess,
    changeRole,
    roles: ROLES
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}

export { ROLES, PERMISSIONS }
