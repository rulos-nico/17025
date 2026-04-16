/**
 * Barrel export for all report indicator components
 */
export { default as TiemposCiclos } from './TiemposCiclos';
export { default as CurvaS } from './CurvaS';
export { default as CargaTrabajo } from './CargaTrabajo';
export { default as EstadoEquipos } from './EstadoEquipos';
export { default as AnaliticaClientes } from './AnaliticaClientes';
export { default as CronogramaGantt } from './CronogramaGantt';

// Re-export shared types for Reportes.tsx
export type {
  Ensayo as ReportEnsayo,
  Proyecto as ReportProyecto,
  Cliente as ReportCliente,
  PersonalInterno,
  Equipo,
  Comprobacion,
  Calibracion,
  TipoEnsayo as ReportTipoEnsayo,
} from './shared';
