/**
 * NuevoDropdown - Dropdown para crear nuevo equipo o sensor
 */

import { useState } from 'react';
import styles from './NuevoDropdown.module.css';

export function NuevoDropdown({ onNewEquipo, onNewSensor }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.triggerButton}>
        + Nuevo
        <span className={styles.triggerArrow}>{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          {/* Menu dropdown */}
          <div className={styles.menu}>
            <button
              onClick={() => {
                onNewEquipo();
                setIsOpen(false);
              }}
              className={styles.menuItem}
            >
              <span className={styles.menuItemIconEquipo}>Equipos</span>
              Nuevo Equipo
            </button>
            <button
              onClick={() => {
                onNewSensor();
                setIsOpen(false);
              }}
              className={styles.menuItemDivider}
            >
              <span className={styles.menuItemIconSensor}>Sensores</span>
              Nuevo Sensor
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default NuevoDropdown;
