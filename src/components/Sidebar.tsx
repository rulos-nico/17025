import { useState, useEffect, useCallback, ReactElement } from 'react';
import { NAV_ITEMS, NavItem } from '../config';

export type IconName =
  | 'dashboard'
  | 'folder'
  | 'test'
  | 'clients'
  | 'reports'
  | 'equipment'
  | 'users'
  | 'calibration'
  | 'check'
  | 'chart';

interface SidebarUser {
  nombre: string;
  rol: string;
  avatar?: string | null;
  email?: string;
}

interface SidebarProps {
  user: SidebarUser | null;
  activeModule: string;
  isMenuOpen: boolean;
  onNavigate: (module: string) => void;
  onCloseMenu: () => void;
  onLogout: () => void;
}

const STORAGE_KEY = 'sidebar-expanded';

function loadExpanded(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function isItemVisible(item: NavItem, userRole: string | undefined): boolean {
  if (userRole && item.roles && !item.roles.includes(userRole)) return false;
  if (item.children && item.children.length > 0) {
    const visibleChildren = item.children.filter(c => !userRole || c.roles.includes(userRole));
    if (visibleChildren.length === 0) return false;
  }
  return true;
}

export default function Sidebar({
  user,
  activeModule,
  isMenuOpen,
  onNavigate,
  onCloseMenu,
  onLogout,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(loadExpanded);

  // Auto-expandir el grupo que contiene el modulo activo
  useEffect(() => {
    for (const item of NAV_ITEMS) {
      if (item.children && item.children.length > 0) {
        const hasActive = item.children.some(c => c.path.slice(1) === activeModule);
        if (hasActive && !expanded[item.path]) {
          setExpanded(prev => ({ ...prev, [item.path]: true }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule]);

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
    } catch {
      /* ignore */
    }
  }, [expanded]);

  const toggleGroup = useCallback((path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      onNavigate(path.slice(1));
      onCloseMenu();
    },
    [onNavigate, onCloseMenu]
  );

  return (
    <aside className={`sidebar ${isMenuOpen ? 'active' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <img src="/logos/LOGO_INGETEC_P_ROJAS.svg" className="logo-img" />
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {NAV_ITEMS.map(item => {
            if (!isItemVisible(item, user?.rol)) return null;

            const hasChildren = !!(item.children && item.children.length > 0);

            if (hasChildren) {
              const visibleChildren = item.children!.filter(
                c => !user?.rol || c.roles.includes(user.rol)
              );
              const hasActiveChild = visibleChildren.some(c => c.path.slice(1) === activeModule);
              const isOpen = expanded[item.path] ?? hasActiveChild;

              return (
                <li key={item.path}>
                  <button
                    className={`nav-link nav-group ${hasActiveChild ? 'has-active-child' : ''}`}
                    onClick={() => toggleGroup(item.path)}
                    aria-expanded={isOpen}
                  >
                    <span className="nav-icon">{getIcon(item.icon as IconName)}</span>
                    <span className="nav-label">{item.label}</span>
                    <span className={`nav-chevron ${isOpen ? 'open' : ''}`} aria-hidden="true">
                      ▸
                    </span>
                  </button>
                  {isOpen && (
                    <ul className="nav-submenu">
                      {visibleChildren.map(child => {
                        const childKey = child.path.slice(1);
                        return (
                          <li key={child.path}>
                            <button
                              className={`nav-link nav-sublink ${
                                activeModule === childKey ? 'active' : ''
                              }`}
                              onClick={() => handleNavigate(child.path)}
                            >
                              <span className="nav-icon">{getIcon(child.icon as IconName)}</span>
                              <span className="nav-label">{child.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const itemKey = item.path.slice(1);
            return (
              <li key={item.path}>
                <button
                  className={`nav-link ${activeModule === itemKey ? 'active' : ''}`}
                  onClick={() => handleNavigate(item.path)}
                >
                  <span className="nav-icon">{getIcon(item.icon as IconName)}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.nombre} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </div>
          <div className="user-details">
            <p className="user-name">{user?.nombre || 'Usuario'}</p>
            <p className="user-role">{user?.rol || 'Rol'}</p>
          </div>
          <button className="btn-icon" onClick={onLogout} title="Cerrar sesión">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ============================================
// ICONS
// ============================================
function getIcon(iconName: IconName): ReactElement {
  const icons: Record<IconName, ReactElement> = {
    dashboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    folder: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    test: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M4 10h16M10 4v16" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    clients: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    reports: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    equipment: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    calibration: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 7h18M3 12h18M3 17h18M7 3v4M12 3v4M17 3v4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    check: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path
          d="M8 12l3 3 5-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    chart: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M7 15l4-4 3 3 5-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return icons[iconName] || icons.dashboard;
}
