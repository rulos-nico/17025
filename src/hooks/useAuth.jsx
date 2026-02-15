/**
 * Hook de autenticación placeholder
 * Laboratorio ISO 17025
 *
 * Sistema de autenticación temporal para desarrollo.
 * Proporciona un usuario demo sin autenticación real.
 */

import { useState, useCallback, createContext, useContext } from 'react';

// ============================================
// USUARIO DEMO
// ============================================

const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@laboratorio.local',
  name: 'Usuario Demo',
  picture: null,
  givenName: 'Usuario',
  familyName: 'Demo',
  rol: 'admin',
};

// ============================================
// CONTEXTO DE AUTENTICACIÓN
// ============================================

const AuthContext = createContext(null);

/**
 * Provider de autenticación
 * Envuelve la aplicación para proporcionar estado de auth global
 */
export const AuthProvider = ({ children }) => {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

/**
 * Hook para consumir el contexto de autenticación
 * NOTA: Debe usarse dentro de AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
};

// ============================================
// HOOK DE ESTADO DE AUTENTICACIÓN
// ============================================

/**
 * Hook interno que maneja el estado de autenticación
 */
const useAuthState = () => {
  const [state, setState] = useState({
    isAuthenticated: false,
    isLoading: false,
    user: null,
  });

  // Función para iniciar sesión (modo demo)
  const login = useCallback(() => {
    setState({
      isAuthenticated: true,
      isLoading: false,
      user: DEMO_USER,
    });
    return true;
  }, []);

  // Función para cerrar sesión
  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  }, []);

  return {
    // Estado
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user,

    // Acciones
    login,
    logout,
  };
};

export default useAuth;
