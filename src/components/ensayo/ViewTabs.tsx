/**
 * ViewTabs - Tabs para cambiar entre vistas Kanban y Jerarquica
 */

import styles from './ViewTabs.module.css';

export type ViewType = 'kanban' | 'hierarchy';

interface ViewTabsProps {
  activeView: ViewType;
  onChangeView: (view: ViewType) => void;
}

/**
 * Componente de tabs para cambiar entre vistas
 */
export function ViewTabs({ activeView, onChangeView }: ViewTabsProps) {
  return (
    <div className={styles.container}>
      <button
        onClick={() => onChangeView('kanban')}
        className={activeView === 'kanban' ? styles.tabActive : styles.tab}
      >
        Tablero Kanban
      </button>
      <button
        onClick={() => onChangeView('hierarchy')}
        className={activeView === 'hierarchy' ? styles.tabActive : styles.tab}
      >
        Por Proyecto
      </button>
    </div>
  );
}

export default ViewTabs;
