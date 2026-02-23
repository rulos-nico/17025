/**
 * HierarchyView - Vista jerarquica de ensayos por proyecto
 */

import { useState, useMemo, useEffect } from 'react';
import { ProyectoNode } from './hierarchy';
import type { Ensayo, Proyecto, Perforacion, Muestra } from '../../hooks/useEnsayosData';
import styles from './HierarchyView.module.css';

interface HierarchyViewProps {
  proyectos: Proyecto[];
  perforaciones: Perforacion[];
  muestras: Muestra[];
  ensayos: Ensayo[];
  onEnsayoClick: (ensayo: Ensayo) => void;
}

/**
 * Vista jerarquica completa: Proyecto > Perforacion > Muestra > Ensayo
 */
export function HierarchyView({
  proyectos,
  perforaciones,
  muestras,
  ensayos,
  onEnsayoClick,
}: HierarchyViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPerforaciones, setExpandedPerforaciones] = useState<(string | number)[]>([]);
  const [expandedMuestras, setExpandedMuestras] = useState<(string | number)[]>([]);

  const handleTogglePerforacion = (perfId: string | number) => {
    setExpandedPerforaciones(prev =>
      prev.includes(perfId) ? prev.filter(id => id !== perfId) : [...prev, perfId]
    );
  };

  const handleToggleMuestra = (muestraId: string | number) => {
    setExpandedMuestras(prev =>
      prev.includes(muestraId) ? prev.filter(id => id !== muestraId) : [...prev, muestraId]
    );
  };

  // Filtrar ensayos por busqueda
  const filteredEnsayos = useMemo(() => {
    if (!searchTerm.trim()) return ensayos;
    const term = searchTerm.toLowerCase();
    const muestra = (e: Ensayo) => (e.muestra as string) || '';
    return ensayos.filter(
      e =>
        e.codigo?.toLowerCase().includes(term) ||
        muestra(e).toLowerCase().includes(term) ||
        e.tipo?.toLowerCase().includes(term) ||
        e.norma?.toLowerCase().includes(term)
    );
  }, [ensayos, searchTerm]);

  // Obtener proyectos que tienen ensayos filtrados
  const proyectosConEnsayos = useMemo(() => {
    const proyectoIds = [...new Set(filteredEnsayos.map(e => e.proyectoId || e.proyecto_id))];
    return proyectos.filter(p => proyectoIds.includes(p.id));
  }, [proyectos, filteredEnsayos]);

  // Expandir todas las perforaciones y muestras si hay busqueda
  useEffect(() => {
    if (searchTerm.trim()) {
      const perforacionIds = filteredEnsayos
        .map(e => e.perforacionId || e.perforacion_id)
        .filter((id): id is string | number => id !== undefined);
      const muestraIds = filteredEnsayos
        .map(e => e.muestraId || e.muestra_id)
        .filter((id): id is string | number => id !== undefined);
      setExpandedPerforaciones([...new Set(perforacionIds)]);
      setExpandedMuestras([...new Set(muestraIds)]);
    }
  }, [searchTerm, filteredEnsayos]);

  return (
    <div>
      {/* Barra de busqueda */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Buscar por codigo, muestra, tipo o norma..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        {searchTerm && (
          <span className={styles.searchResults}>{filteredEnsayos.length} resultado(s)</span>
        )}
      </div>

      {/* Encabezado de columnas */}
      <div className={styles.columnHeader}>
        <span className={styles.colEstado}>Estado</span>
        <span className={styles.colCodigo}>Codigo</span>
        <span className={styles.colTipo}>Tipo</span>
        <span className={styles.colMuestra}>Muestra</span>
        <span className={styles.colNorma}>Norma</span>
        <span className={styles.colFecha}>Fecha</span>
        <span className={styles.colSheet}>Sheet</span>
      </div>

      {/* Arbol de proyectos */}
      {proyectosConEnsayos.length === 0 ? (
        <div className={styles.empty}>
          {searchTerm ? 'No se encontraron ensayos con ese criterio' : 'No hay ensayos disponibles'}
        </div>
      ) : (
        proyectosConEnsayos.map(proyecto => (
          <ProyectoNode
            key={proyecto.id as string}
            proyecto={proyecto}
            perforaciones={perforaciones}
            muestras={muestras}
            ensayos={filteredEnsayos}
            expandedPerforaciones={expandedPerforaciones}
            expandedMuestras={expandedMuestras}
            onTogglePerforacion={handleTogglePerforacion}
            onToggleMuestra={handleToggleMuestra}
            onEnsayoClick={onEnsayoClick}
          />
        ))
      )}
    </div>
  );
}

export default HierarchyView;
