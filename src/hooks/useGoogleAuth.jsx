/**
 * Hook para autenticación con Google OAuth
 * Laboratorio ISO 17025
 *
 * Maneja el estado de autenticación y proporciona funciones
 * para login/logout con Google.
 *
 * MODO DEMO: Si VITE_AUTH_BYPASS=true, permite acceso sin Google OAuth
 */

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import {
  initGoogleServices,
  requestAuthorization,
  isAuthenticated,
  getAccessToken,
} from '../services/driveService.js';
import { setAuthToken } from '../services/apiService.js';

// ============================================
// CONFIGURACIÓN DE MODO DEMO/BYPASS
// ============================================

const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';

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

const GoogleAuthContext = createContext(null);

/**
 * Provider de autenticación Google
 * Envuelve la aplicación para proporcionar estado de auth global
 */
export const GoogleAuthProvider = ({ children }) => {
  const auth = useGoogleAuthState();

  return <GoogleAuthContext.Provider value={auth}>{children}</GoogleAuthContext.Provider>;
};

/**
 * Hook para consumir el contexto de autenticación
 * NOTA: Debe usarse dentro de GoogleAuthProvider
 */
export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);

  if (!context) {
    // Throw para indicar uso incorrecto en desarrollo
    throw new Error('useGoogleAuth debe usarse dentro de GoogleAuthProvider');
  }

  return context;
};

/**
 * Hook alternativo para usar sin Provider (standalone)
 * Útil para componentes que no están dentro del Provider
 */
export const useGoogleAuthStandalone = () => {
  return useGoogleAuthState();
};

// ============================================
// HOOK DE ESTADO DE AUTENTICACIÓN
// ============================================

/**
 * Hook interno que maneja el estado de autenticación
 */
const useGoogleAuthState = () => {
  const [state, setState] = useState({
    isInitialized: false,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    user: null,
    isBypassMode: AUTH_BYPASS,
  });

  // Función para obtener info del usuario desde Google
  const fetchUserInfo = useCallback(async () => {
    // En modo bypass, no intentar obtener info de Google
    if (AUTH_BYPASS) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      // Guardar token para el API service
      setAuthToken(token);

      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        setState(prev => ({
          ...prev,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            givenName: user.given_name,
            familyName: user.family_name,
          },
        }));
      }
    } catch (err) {
      console.error('Error obteniendo info de usuario:', err);
    }
  }, []);

  // Inicializar al montar
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // MODO BYPASS: Autenticar automáticamente con usuario demo
      if (AUTH_BYPASS) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            isInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            user: DEMO_USER,
            isBypassMode: true,
          }));
        }
        console.info('🔓 Modo BYPASS activado - Usuario demo autenticado');
        return;
      }

      // MODO NORMAL: Inicializar Google Services
      try {
        await initGoogleServices();

        if (mounted) {
          const authenticated = isAuthenticated();
          setState(prev => ({
            ...prev,
            isInitialized: true,
            isAuthenticated: authenticated,
            isLoading: false,
          }));

          // Si ya está autenticado, obtener info del usuario
          if (authenticated) {
            fetchUserInfo();
          }
        }
      } catch (err) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            isInitialized: true,
            isLoading: false,
            error: err.message || 'Error inicializando Google Services',
          }));
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchUserInfo]);

  // Función para iniciar sesión
  const login = useCallback(async () => {
    // En modo bypass, ya está autenticado
    if (AUTH_BYPASS) {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: DEMO_USER,
      }));
      return true;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await requestAuthorization();
      await fetchUserInfo();

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
      }));

      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.error_description || err.message || 'Error de autenticación',
      }));
      return false;
    }
  }, [fetchUserInfo]);

  // Función para cerrar sesión
  const logout = useCallback(() => {
    // Limpiar token del API service
    setAuthToken(null);

    // En modo bypass, solo limpiar el estado
    if (AUTH_BYPASS) {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
      }));
      return;
    }

    const token = getAccessToken();

    if (token && window.google?.accounts?.oauth2) {
      // Revocar el token
      window.google.accounts.oauth2.revoke(token);
    }

    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
    }));
  }, []);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // Estado
    isInitialized: state.isInitialized,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    user: state.user,
    isBypassMode: state.isBypassMode,

    // Acciones
    login,
    logout,
    clearError,

    // Token (para uso directo si es necesario)
    getToken: AUTH_BYPASS ? () => null : getAccessToken,
  };
};

// ============================================
// HOOKS AUXILIARES
// ============================================

/**
 * Hook que requiere autenticación
 * Redirige o muestra mensaje si no está autenticado
 */
export const useRequireAuth = (redirectTo = null) => {
  const auth = useGoogleAuth();

  useEffect(() => {
    if (auth.isInitialized && !auth.isAuthenticated && redirectTo) {
      // Aquí podrías usar un router para redirigir
      console.warn('Usuario no autenticado. Redirigir a:', redirectTo);
    }
  }, [auth.isInitialized, auth.isAuthenticated, redirectTo]);

  return auth;
};

/**
 * Hook para verificar permisos específicos
 * @param {Array<string>} _requiredRoles - Roles requeridos (no usado aún)
 */
export const useHasPermission = (_requiredRoles = []) => {
  const { user, isAuthenticated: authenticated } = useGoogleAuth();

  // Calcular permiso basado en estado de autenticación
  const hasPermission = useMemo(() => {
    if (!authenticated || !user) {
      return false;
    }
    // Por ahora, todos los usuarios autenticados tienen permiso
    // Esto se puede expandir para verificar roles desde la BD
    return true;
  }, [authenticated, user]);

  return hasPermission;
};

export default useGoogleAuth;
