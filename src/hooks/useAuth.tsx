/**
 * Hook de autenticación placeholder
 * Laboratorio ISO 17025
 *
 * Sistema de autenticación temporal para desarrollo.
 * Proporciona un usuario demo sin autenticación real.
 */

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  givenName: string;
  familyName: string;
  rol: string;
  clienteId?: string | number;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  login: () => boolean;
  logout: () => void;
}

// ============================================
// USUARIO DEMO
// ============================================

const DEMO_USER: AuthUser = {
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

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticación
 * Envuelve la aplicación para proporcionar estado de auth global
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

/**
 * Hook para consumir el contexto de autenticación
 * NOTA: Debe usarse dentro de AuthProvider
 */
export const useAuth = (): AuthContextValue => {
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
const useAuthState = (): AuthContextValue => {
  const [state, setState] = useState<AuthState>({
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
