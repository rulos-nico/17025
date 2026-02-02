/**
 * Componente de botón de autenticación con Google
 * Muestra estado de conexión y permite login/logout
 */

import { useGoogleAuth } from '../hooks/useGoogleAuth.jsx';

// Icono de Google (fuera del componente para evitar re-creación)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Loading spinner
const LoadingSpinner = () => (
  <span
    style={{
      width: '16px',
      height: '16px',
      border: '2px solid #e5e7eb',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'spin 0.8s linear infinite',
    }}
  />
);

/**
 * Botón de autenticación Google
 * @param {Object} props
 * @param {string} props.variant - 'full' | 'compact' | 'icon' | 'large'
 * @param {string} props.className - Clases CSS adicionales
 */
const GoogleAuthButton = ({ variant = 'full', className = '' }) => {
  const {
    isInitialized,
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout,
    clearError,
  } = useGoogleAuth();

  // Estilos base
  const baseStyles = {
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    loginButton: {
      backgroundColor: '#fff',
      color: '#3c4043',
      border: '1px solid #dadce0',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    loginButtonLarge: {
      backgroundColor: '#fff',
      color: '#3c4043',
      border: '1px solid #dadce0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '14px 32px',
      fontSize: '16px',
      borderRadius: '8px',
    },
    logoutButton: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover',
    },
    avatarPlaceholder: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: '#e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600',
      color: '#6b7280',
    },
    userName: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#111827',
    },
    userEmail: {
      fontSize: '12px',
      color: '#6b7280',
    },
    error: {
      color: '#dc2626',
      fontSize: '12px',
      marginTop: '4px',
    },
  };

  // Estado: Cargando inicialización
  if (!isInitialized || isLoading) {
    return (
      <button
        style={{ ...baseStyles.button, ...baseStyles.loginButton }}
        disabled
        className={className}
      >
        <LoadingSpinner />
        {variant !== 'icon' && <span>Cargando...</span>}
      </button>
    );
  }

  // Estado: No autenticado - mostrar botón de login
  if (!isAuthenticated) {
    const buttonStyle = variant === 'large' 
      ? { ...baseStyles.button, ...baseStyles.loginButtonLarge }
      : { ...baseStyles.button, ...baseStyles.loginButton };
    
    return (
      <div>
        <button
          style={buttonStyle}
          onClick={login}
          className={className}
        >
          <GoogleIcon />
          {variant !== 'icon' && (
            <span>
              {variant === 'compact' ? 'Conectar' : 
               variant === 'large' ? 'Iniciar sesión con Google' : 
               'Conectar con Google'}
            </span>
          )}
        </button>
        {error && (
          <div style={baseStyles.error} onClick={clearError}>
            {error} <span style={{ cursor: 'pointer' }}>(click para cerrar)</span>
          </div>
        )}
      </div>
    );
  }

  // Estado: Autenticado - mostrar info del usuario
  if (variant === 'icon') {
    return (
      <button
        style={{ ...baseStyles.button, padding: '4px' }}
        onClick={logout}
        title={user?.email || 'Cerrar sesión'}
        className={className}
      >
        {user?.picture ? (
          <img 
            src={user.picture} 
            alt={user.name} 
            style={baseStyles.avatar}
          />
        ) : (
          <div style={baseStyles.avatarPlaceholder}>
            {user?.name?.charAt(0) || '?'}
          </div>
        )}
      </button>
    );
  }

  return (
    <div style={baseStyles.userInfo} className={className}>
      {user?.picture ? (
        <img 
          src={user.picture} 
          alt={user.name} 
          style={baseStyles.avatar}
        />
      ) : (
        <div style={baseStyles.avatarPlaceholder}>
          {user?.name?.charAt(0) || '?'}
        </div>
      )}
      
      {variant === 'full' && (
        <div>
          <div style={baseStyles.userName}>{user?.name || 'Usuario'}</div>
          <div style={baseStyles.userEmail}>{user?.email}</div>
        </div>
      )}
      
      <button
        style={{ ...baseStyles.button, ...baseStyles.logoutButton }}
        onClick={logout}
      >
        {variant === 'compact' ? 'Salir' : 'Cerrar sesión'}
      </button>
    </div>
  );
};

/**
 * Componente de estado de conexión simple
 * Solo muestra el estado (conectado/desconectado) sin botones
 */
export const ConnectionStatus = () => {
  const { isAuthenticated, user } = useGoogleAuth();

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
    },
    dot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: isAuthenticated ? '#22c55e' : '#ef4444',
    },
    text: {
      color: isAuthenticated ? '#16a34a' : '#dc2626',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.dot} />
      <span style={styles.text}>
        {isAuthenticated ? `Conectado${user?.name ? ` como ${user.name}` : ''}` : 'Desconectado'}
      </span>
    </div>
  );
};

/**
 * Wrapper que muestra contenido solo si está autenticado
 */
export const AuthRequired = ({ children, fallback = null }) => {
  const { isAuthenticated, isInitialized } = useGoogleAuth();

  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return fallback || (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ marginBottom: '20px', color: '#6b7280' }}>
          Debes iniciar sesión para ver este contenido
        </p>
        <GoogleAuthButton variant="full" />
      </div>
    );
  }

  return children;
};

// CSS para animación de spinner (agregar en su CSS global o usar CSS-in-JS)
if (typeof document !== 'undefined') {
  const styleId = 'google-auth-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default GoogleAuthButton;
