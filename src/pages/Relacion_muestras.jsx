import PageLayout from '../components/PageLayout';
import styles from './Relacion_muestras.module.css';

export default function RelacionMuestras({ setActiveModule }) {
  const go = module => {
    if (typeof setActiveModule === 'function') return setActiveModule(module);
    // fallback: notify user if prop not provided
    alert(`Navegar a: ${module}`);
  };

  return (
    <PageLayout title="Relación de Muestras">
      <p>Acciones disponibles para la gestión de relaciones de muestras.</p>

      <div className={styles.relationActions}>
        <button className="btn-primary" onClick={() => go('reportes')}>
          Creación de Proyecto
        </button>
        <button className="btn-secondary" onClick={() => go('reportes')}>
          Relación de Perforaciones
        </button>
        <button className="btn-secondary" onClick={() => go('ensayos')}>
          Ingreso de Ensayos
        </button>
      </div>
    </PageLayout>
  );
}
