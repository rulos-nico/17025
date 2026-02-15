/**
 * ViewTabs - Tabs para cambiar entre vistas Kanban y Jerarquica
 */

import styles from './ViewTabs.module.css';

/**
 * Componente de tabs para cambiar entre vistas
 *
 * @param {Object} props
 * @param {string} props.activeView - Vista activa ('kanban' | 'hierarchy')
 * @param {Function} props.onChangeView - Callback al cambiar vista
 */
export function ViewTabs({ activeView, onChangeView }) {
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
