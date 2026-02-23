/**
 * Configuracion de Personal y Clientes
 *
 * Constantes para cargos, autorizaciones y categorias
 */

// ============================================
// TYPES
// ============================================

export type CargoId =
  | 'director'
  | 'coord_calidad'
  | 'coord_tecnico'
  | 'laboratorista'
  | 'auxiliar'
  | 'auxiliar_admin'
  | 'cliente';

export type CargoTipo = 'interno' | 'externo';

export interface Cargo {
  id: CargoId;
  nombre: string;
  nivel: number;
  color: string;
  descripcion: string;
  tipo: CargoTipo;
}

export type AutorizacionCategoria = 'ensayo' | 'revision' | 'metrologia' | 'preparacion' | 'admin';

export interface Autorizacion {
  id: string;
  nombre: string;
  categoria: AutorizacionCategoria;
  norma: string;
}

export interface CategoriaAutorizacion {
  nombre: string;
  color: string;
}

// ============================================
// CARGOS
// ============================================

export const CARGOS: Record<CargoId, Cargo> = {
  director: {
    id: 'director',
    nombre: 'Director de Laboratorio',
    nivel: 1,
    color: '#7C3AED',
    descripcion: 'Responsable general del laboratorio y del sistema de gestion',
    tipo: 'interno',
  },
  coord_calidad: {
    id: 'coord_calidad',
    nombre: 'Coordinador de Calidad',
    nivel: 2,
    color: '#2563EB',
    descripcion: 'Responsable del sistema de gestion de calidad ISO 17025',
    tipo: 'interno',
  },
  coord_tecnico: {
    id: 'coord_tecnico',
    nombre: 'Coordinador Tecnico',
    nivel: 2,
    color: '#0891B2',
    descripcion: 'Responsable de la gestion tecnica y supervision de ensayos',
    tipo: 'interno',
  },
  laboratorista: {
    id: 'laboratorista',
    nombre: 'Laboratorista',
    nivel: 3,
    color: '#059669',
    descripcion: 'Ejecutor de ensayos y analisis',
    tipo: 'interno',
  },
  auxiliar: {
    id: 'auxiliar',
    nombre: 'Auxiliar de Laboratorio',
    nivel: 4,
    color: '#D97706',
    descripcion: 'Apoyo en preparacion de muestras y actividades de laboratorio',
    tipo: 'interno',
  },
  auxiliar_admin: {
    id: 'auxiliar_admin',
    nombre: 'Auxiliar Administrativo',
    nivel: 4,
    color: '#6B7280',
    descripcion: 'Apoyo en gestion documental y administrativa',
    tipo: 'interno',
  },
  cliente: {
    id: 'cliente',
    nombre: 'Cliente',
    nivel: 5,
    color: '#EC4899',
    descripcion: 'Cliente externo del laboratorio',
    tipo: 'externo',
  },
};

// ============================================
// AUTORIZACIONES CATALOGO
// ============================================

export const AUTORIZACIONES_CATALOGO: Record<string, Autorizacion> = {
  // Ensayos mecanicos
  ens_traccion: {
    id: 'ens_traccion',
    nombre: 'Ensayo de Traccion',
    categoria: 'ensayo',
    norma: 'ASTM E8',
  },
  ens_dureza: {
    id: 'ens_dureza',
    nombre: 'Ensayo de Dureza',
    categoria: 'ensayo',
    norma: 'ASTM E18',
  },
  ens_impacto: {
    id: 'ens_impacto',
    nombre: 'Ensayo de Impacto Charpy',
    categoria: 'ensayo',
    norma: 'ASTM E23',
  },
  ens_compresion: {
    id: 'ens_compresion',
    nombre: 'Ensayo de Compresion',
    categoria: 'ensayo',
    norma: 'ASTM E9',
  },
  ens_doblado: {
    id: 'ens_doblado',
    nombre: 'Ensayo de Doblado',
    categoria: 'ensayo',
    norma: 'ASTM E290',
  },

  // Analisis quimico
  anal_oes: {
    id: 'anal_oes',
    nombre: 'Analisis Quimico OES',
    categoria: 'ensayo',
    norma: 'ASTM E415',
  },
  anal_xrf: {
    id: 'anal_xrf',
    nombre: 'Analisis XRF',
    categoria: 'ensayo',
    norma: 'ASTM E1621',
  },

  // Metalografia
  metal_macro: {
    id: 'metal_macro',
    nombre: 'Macrografia',
    categoria: 'ensayo',
    norma: 'ASTM E340',
  },
  metal_micro: {
    id: 'metal_micro',
    nombre: 'Micrografia',
    categoria: 'ensayo',
    norma: 'ASTM E3',
  },

  // Ensayos no destructivos
  end_ut: {
    id: 'end_ut',
    nombre: 'Ultrasonido Industrial',
    categoria: 'ensayo',
    norma: 'ASTM E114',
  },
  end_rt: {
    id: 'end_rt',
    nombre: 'Radiografia Industrial',
    categoria: 'ensayo',
    norma: 'ASTM E94',
  },
  end_pt: {
    id: 'end_pt',
    nombre: 'Liquidos Penetrantes',
    categoria: 'ensayo',
    norma: 'ASTM E165',
  },
  end_mt: {
    id: 'end_mt',
    nombre: 'Particulas Magneticas',
    categoria: 'ensayo',
    norma: 'ASTM E709',
  },

  // Revision y aprobacion
  rev_tecnica: {
    id: 'rev_tecnica',
    nombre: 'Revision Tecnica de Informes',
    categoria: 'revision',
    norma: 'ISO 17025',
  },
  rev_calidad: {
    id: 'rev_calidad',
    nombre: 'Revision de Calidad',
    categoria: 'revision',
    norma: 'ISO 17025',
  },
  aprob_informe: {
    id: 'aprob_informe',
    nombre: 'Aprobacion de Informes',
    categoria: 'revision',
    norma: 'ISO 17025',
  },

  // Calibracion y verificacion
  verif_equipos: {
    id: 'verif_equipos',
    nombre: 'Verificacion Intermedia de Equipos',
    categoria: 'metrologia',
    norma: 'ISO 17025',
  },
  cal_interna: {
    id: 'cal_interna',
    nombre: 'Calibracion Interna',
    categoria: 'metrologia',
    norma: 'ISO 17025',
  },

  // Preparacion
  prep_muestras: {
    id: 'prep_muestras',
    nombre: 'Preparacion de Muestras',
    categoria: 'preparacion',
    norma: 'Interno',
  },
  prep_probetas: {
    id: 'prep_probetas',
    nombre: 'Mecanizado de Probetas',
    categoria: 'preparacion',
    norma: 'ASTM E8',
  },

  // Administrativo
  recep_muestras: {
    id: 'recep_muestras',
    nombre: 'Recepcion de Muestras',
    categoria: 'admin',
    norma: 'ISO 17025',
  },
  gestion_doc: {
    id: 'gestion_doc',
    nombre: 'Gestion Documental',
    categoria: 'admin',
    norma: 'ISO 17025',
  },
  atencion_cliente: {
    id: 'atencion_cliente',
    nombre: 'Atencion al Cliente',
    categoria: 'admin',
    norma: 'Interno',
  },
};

// ============================================
// CATEGORIAS DE AUTORIZACION
// ============================================

export const CATEGORIAS_AUTORIZACION: Record<AutorizacionCategoria, CategoriaAutorizacion> = {
  ensayo: { nombre: 'Ensayos', color: '#10B981' },
  revision: { nombre: 'Revision', color: '#8B5CF6' },
  metrologia: { nombre: 'Metrologia', color: '#3B82F6' },
  preparacion: { nombre: 'Preparacion', color: '#F59E0B' },
  admin: { nombre: 'Administrativo', color: '#6B7280' },
};

// ============================================
// HELPERS
// ============================================

const DEFAULT_CARGO: Cargo = {
  id: 'auxiliar' as CargoId,
  nombre: 'Desconocido',
  tipo: 'interno',
  color: '#6B7280',
  nivel: 99,
  descripcion: 'Cargo no definido',
};

/**
 * Verifica si un string es un CargoId válido
 */
export function isCargoId(value: string): value is CargoId {
  return value in CARGOS;
}

/**
 * Obtiene un cargo por ID de forma segura (puede retornar undefined)
 */
export function getCargo(cargoId: string): Cargo | undefined {
  if (isCargoId(cargoId)) {
    return CARGOS[cargoId];
  }
  return undefined;
}

/**
 * Obtiene la informacion de un cargo por su ID (siempre retorna un Cargo)
 */
export function getCargoInfo(cargoId: string | null | undefined): Cargo {
  if (!cargoId || !(cargoId in CARGOS)) {
    return {
      ...DEFAULT_CARGO,
      id: (cargoId || 'desconocido') as CargoId,
      nombre: cargoId || 'Desconocido',
    };
  }
  return CARGOS[cargoId as CargoId];
}

/**
 * Obtiene los cargos internos (excluyendo cliente)
 */
export function getCargosInternos(): Array<[string, Cargo]> {
  return Object.entries(CARGOS).filter(([key]) => key !== 'cliente') as Array<[string, Cargo]>;
}
