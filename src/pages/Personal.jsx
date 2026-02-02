import { useState, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge, Card, Modal } from '../components/ui';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

// ============================================
// CONFIGURACION DE CARGOS Y AUTORIZACIONES
// ============================================

const CARGOS = {
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

// Autorizaciones nominales por tipo de actividad
const AUTORIZACIONES_CATALOGO = {
  // Ensayos mecanicos
  'ens_traccion': { id: 'ens_traccion', nombre: 'Ensayo de Traccion', categoria: 'ensayo', norma: 'ASTM E8' },
  'ens_dureza': { id: 'ens_dureza', nombre: 'Ensayo de Dureza', categoria: 'ensayo', norma: 'ASTM E18' },
  'ens_impacto': { id: 'ens_impacto', nombre: 'Ensayo de Impacto Charpy', categoria: 'ensayo', norma: 'ASTM E23' },
  'ens_compresion': { id: 'ens_compresion', nombre: 'Ensayo de Compresion', categoria: 'ensayo', norma: 'ASTM E9' },
  'ens_doblado': { id: 'ens_doblado', nombre: 'Ensayo de Doblado', categoria: 'ensayo', norma: 'ASTM E290' },
  
  // Analisis quimico
  'anal_oes': { id: 'anal_oes', nombre: 'Analisis Quimico OES', categoria: 'ensayo', norma: 'ASTM E415' },
  'anal_xrf': { id: 'anal_xrf', nombre: 'Analisis XRF', categoria: 'ensayo', norma: 'ASTM E1621' },
  
  // Metalografia
  'metal_macro': { id: 'metal_macro', nombre: 'Macrografia', categoria: 'ensayo', norma: 'ASTM E340' },
  'metal_micro': { id: 'metal_micro', nombre: 'Micrografia', categoria: 'ensayo', norma: 'ASTM E3' },
  
  // Ensayos no destructivos
  'end_ut': { id: 'end_ut', nombre: 'Ultrasonido Industrial', categoria: 'ensayo', norma: 'ASTM E114' },
  'end_rt': { id: 'end_rt', nombre: 'Radiografia Industrial', categoria: 'ensayo', norma: 'ASTM E94' },
  'end_pt': { id: 'end_pt', nombre: 'Liquidos Penetrantes', categoria: 'ensayo', norma: 'ASTM E165' },
  'end_mt': { id: 'end_mt', nombre: 'Particulas Magneticas', categoria: 'ensayo', norma: 'ASTM E709' },
  
  // Revision y aprobacion
  'rev_tecnica': { id: 'rev_tecnica', nombre: 'Revision Tecnica de Informes', categoria: 'revision', norma: 'ISO 17025' },
  'rev_calidad': { id: 'rev_calidad', nombre: 'Revision de Calidad', categoria: 'revision', norma: 'ISO 17025' },
  'aprob_informe': { id: 'aprob_informe', nombre: 'Aprobacion de Informes', categoria: 'revision', norma: 'ISO 17025' },
  
  // Calibracion y verificacion
  'verif_equipos': { id: 'verif_equipos', nombre: 'Verificacion Intermedia de Equipos', categoria: 'metrologia', norma: 'ISO 17025' },
  'cal_interna': { id: 'cal_interna', nombre: 'Calibracion Interna', categoria: 'metrologia', norma: 'ISO 17025' },
  
  // Preparacion
  'prep_muestras': { id: 'prep_muestras', nombre: 'Preparacion de Muestras', categoria: 'preparacion', norma: 'Interno' },
  'prep_probetas': { id: 'prep_probetas', nombre: 'Mecanizado de Probetas', categoria: 'preparacion', norma: 'ASTM E8' },
  
  // Administrativo
  'recep_muestras': { id: 'recep_muestras', nombre: 'Recepcion de Muestras', categoria: 'admin', norma: 'ISO 17025' },
  'gestion_doc': { id: 'gestion_doc', nombre: 'Gestion Documental', categoria: 'admin', norma: 'ISO 17025' },
  'atencion_cliente': { id: 'atencion_cliente', nombre: 'Atencion al Cliente', categoria: 'admin', norma: 'Interno' },
};

const CATEGORIAS_AUTORIZACION = {
  ensayo: { nombre: 'Ensayos', color: '#10B981' },
  revision: { nombre: 'Revision', color: '#8B5CF6' },
  metrologia: { nombre: 'Metrologia', color: '#3B82F6' },
  preparacion: { nombre: 'Preparacion', color: '#F59E0B' },
  admin: { nombre: 'Administrativo', color: '#6B7280' },
};

// ============================================
// DATOS MOCK - PROYECTOS (para relacionar)
// ============================================

const MOCK_PROYECTOS = [
  { id: 'pry-1', codigo: 'PRY-2025-001', nombre: 'Caracterizacion Acero Estructural - Torre Norte', estado: 'activo', clienteId: 'per-010' },
  { id: 'pry-2', codigo: 'PRY-2025-002', nombre: 'Control de Calidad - Lote Pernos A325', estado: 'activo', clienteId: 'per-010' },
  { id: 'pry-3', codigo: 'PRY-2024-089', nombre: 'Certificacion Soldadura - Proyecto Minero', estado: 'completado', clienteId: 'per-010' },
  { id: 'pry-4', codigo: 'PRY-2025-003', nombre: 'Analisis Metalurgico - Falla Eje Principal', estado: 'activo', clienteId: 'per-011' },
  { id: 'pry-5', codigo: 'PRY-2025-004', nombre: 'Ensayos END - Estanques Combustible', estado: 'activo', clienteId: 'per-012' },
  { id: 'pry-6', codigo: 'PRY-2024-095', nombre: 'Calificacion Soldadores WPS', estado: 'completado', clienteId: 'per-012' },
];

// ============================================
// DATOS MOCK - PERSONAL DEL LABORATORIO
// ============================================

const MOCK_PERSONAL = [
  {
    id: 'per-001',
    codigo: 'LAB-001',
    nombre: 'Roberto',
    apellido: 'Martinez Silva',
    email: 'rmartinez@laboratorio.cl',
    telefono: '+56 9 8765 4321',
    cargo: 'director',
    fecha_ingreso: '2015-03-01',
    activo: true,
    foto: null,
    empresa: null, // Solo para clientes
    rut: null, // Solo para clientes
    proyectos: ['pry-1', 'pry-2', 'pry-3', 'pry-4', 'pry-5', 'pry-6'], // Director ve todos
    
    // Autorizaciones nominales
    autorizaciones: [
      { id: 'aprob_informe', fecha_autorizacion: '2015-03-15', vigente: true },
      { id: 'rev_tecnica', fecha_autorizacion: '2015-03-15', vigente: true },
      { id: 'rev_calidad', fecha_autorizacion: '2015-03-15', vigente: true },
    ],
    
    // Estudios academicos
    estudios: [
      {
        id: 'est-001',
        titulo: 'Ingeniero Civil Mecanico',
        institucion: 'Universidad de Chile',
        fecha_obtencion: '2005-12-15',
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
      },
      {
        id: 'est-002',
        titulo: 'Magister en Ciencia de Materiales',
        institucion: 'Universidad de Santiago',
        fecha_obtencion: '2010-08-20',
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
      },
    ],
    
    // Capacitaciones
    capacitaciones: [
      {
        id: 'cap-001',
        nombre: 'Auditor Interno ISO 17025:2017',
        institucion: 'SGS Chile',
        fecha: '2023-05-15',
        duracion_horas: 24,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: '2026-05-15',
      },
      {
        id: 'cap-002',
        nombre: 'Interpretacion ISO/IEC 17025:2017',
        institucion: 'INN Chile',
        fecha: '2022-03-10',
        duracion_horas: 16,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
    ],
  },
  {
    id: 'per-002',
    codigo: 'LAB-002',
    nombre: 'Carolina',
    apellido: 'Vega Fernandez',
    email: 'cvega@laboratorio.cl',
    telefono: '+56 9 7654 3210',
    cargo: 'coord_calidad',
    fecha_ingreso: '2018-06-15',
    activo: true,
    foto: null,
    empresa: null,
    rut: null,
    proyectos: ['pry-1', 'pry-2', 'pry-3', 'pry-4', 'pry-5', 'pry-6'], // Coord ve todos
    
    autorizaciones: [
      { id: 'rev_calidad', fecha_autorizacion: '2018-07-01', vigente: true },
      { id: 'gestion_doc', fecha_autorizacion: '2018-07-01', vigente: true },
      { id: 'verif_equipos', fecha_autorizacion: '2019-01-15', vigente: true },
    ],
    
    estudios: [
      {
        id: 'est-003',
        titulo: 'Ingeniero en Control de Calidad',
        institucion: 'Universidad Tecnica Federico Santa Maria',
        fecha_obtencion: '2012-12-20',
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
      },
    ],
    
    capacitaciones: [
      {
        id: 'cap-003',
        nombre: 'Lead Auditor ISO 17025:2017',
        institucion: 'Bureau Veritas',
        fecha: '2023-09-20',
        duracion_horas: 40,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: '2026-09-20',
      },
      {
        id: 'cap-004',
        nombre: 'Gestion de Riesgos ISO 31000',
        institucion: 'INN Chile',
        fecha: '2022-11-05',
        duracion_horas: 16,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
      {
        id: 'cap-005',
        nombre: 'Metrologia Basica',
        institucion: 'CESMEC',
        fecha: '2021-04-12',
        duracion_horas: 24,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
    ],
  },
  {
    id: 'per-003',
    codigo: 'LAB-003',
    nombre: 'Carlos',
    apellido: 'Rodriguez Perez',
    email: 'crodriguez@laboratorio.cl',
    telefono: '+56 9 6543 2109',
    cargo: 'coord_tecnico',
    fecha_ingreso: '2016-02-01',
    activo: true,
    foto: null,
    empresa: null,
    rut: null,
    proyectos: ['pry-1', 'pry-2', 'pry-3', 'pry-4', 'pry-5', 'pry-6'], // Coord ve todos
    
    autorizaciones: [
      { id: 'rev_tecnica', fecha_autorizacion: '2016-03-01', vigente: true },
      { id: 'ens_traccion', fecha_autorizacion: '2016-03-15', vigente: true },
      { id: 'ens_dureza', fecha_autorizacion: '2016-03-15', vigente: true },
      { id: 'ens_impacto', fecha_autorizacion: '2016-03-15', vigente: true },
      { id: 'verif_equipos', fecha_autorizacion: '2017-01-10', vigente: true },
      { id: 'cal_interna', fecha_autorizacion: '2019-06-01', vigente: true },
    ],
    
    estudios: [
      {
        id: 'est-004',
        titulo: 'Ingeniero Metalurgico',
        institucion: 'Universidad de Concepcion',
        fecha_obtencion: '2008-12-18',
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
      },
    ],
    
    capacitaciones: [
      {
        id: 'cap-006',
        nombre: 'Ensayos Mecanicos de Materiales Metalicos',
        institucion: 'IDIEM',
        fecha: '2023-03-20',
        duracion_horas: 40,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
      {
        id: 'cap-007',
        nombre: 'Incertidumbre de Medicion',
        institucion: 'CESMEC',
        fecha: '2022-08-15',
        duracion_horas: 24,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
      {
        id: 'cap-008',
        nombre: 'Operacion Maquina Universal Instron',
        institucion: 'Instron (Fabricante)',
        fecha: '2019-04-10',
        duracion_horas: 16,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
    ],
  },
  {
    id: 'per-004',
    codigo: 'LAB-004',
    nombre: 'Maria',
    apellido: 'Gonzalez Torres',
    email: 'mgonzalez@laboratorio.cl',
    telefono: '+56 9 5432 1098',
    cargo: 'laboratorista',
    fecha_ingreso: '2019-08-01',
    activo: true,
    foto: null,
    empresa: null,
    rut: null,
    proyectos: ['pry-1', 'pry-2', 'pry-3'], // Asignado a proyectos mecanicos
    
    autorizaciones: [
      { id: 'ens_traccion', fecha_autorizacion: '2019-10-01', vigente: true },
      { id: 'ens_dureza', fecha_autorizacion: '2019-10-01', vigente: true },
      { id: 'ens_impacto', fecha_autorizacion: '2020-02-15', vigente: true },
      { id: 'ens_doblado', fecha_autorizacion: '2020-06-01', vigente: true },
      { id: 'prep_probetas', fecha_autorizacion: '2019-09-01', vigente: true },
      { id: 'verif_equipos', fecha_autorizacion: '2021-03-01', vigente: true },
    ],
    
    estudios: [
      {
        id: 'est-005',
        titulo: 'Tecnico en Metalurgia',
        institucion: 'INACAP',
        fecha_obtencion: '2017-12-15',
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
      },
    ],
    
    capacitaciones: [
      {
        id: 'cap-009',
        nombre: 'Ensayo de Traccion ASTM E8',
        institucion: 'IDIEM',
        fecha: '2019-09-15',
        duracion_horas: 24,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
      {
        id: 'cap-010',
        nombre: 'Ensayo de Dureza ASTM E18',
        institucion: 'IDIEM',
        fecha: '2019-09-20',
        duracion_horas: 16,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
      {
        id: 'cap-011',
        nombre: 'Ensayo de Impacto Charpy ASTM E23',
        institucion: 'IDIEM',
        fecha: '2020-02-10',
        duracion_horas: 16,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
    ],
  },
  {
    id: 'per-005',
    codigo: 'LAB-005',
    nombre: 'Juan',
    apellido: 'Perez Soto',
    email: 'jperez@laboratorio.cl',
    telefono: '+56 9 4321 0987',
    cargo: 'laboratorista',
    fecha_ingreso: '2020-03-15',
    activo: true,
    foto: null,
    empresa: null,
    rut: null,
    proyectos: ['pry-4'], // Asignado a analisis metalurgico
    
    autorizaciones: [
      { id: 'anal_oes', fecha_autorizacion: '2020-05-01', vigente: true },
      { id: 'anal_xrf', fecha_autorizacion: '2020-05-01', vigente: true },
      { id: 'metal_macro', fecha_autorizacion: '2021-01-15', vigente: true },
      { id: 'metal_micro', fecha_autorizacion: '2021-06-01', vigente: true },
      { id: 'prep_muestras', fecha_autorizacion: '2020-04-01', vigente: true },
    ],
    
    estudios: [
      {
        id: 'est-006',
        titulo: 'Quimico Laboratorista',
        institucion: 'Universidad de Valparaiso',
        fecha_obtencion: '2018-12-20',
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
      },
    ],
    
    capacitaciones: [
      {
        id: 'cap-012',
        nombre: 'Operacion Espectrometro Bruker Q4',
        institucion: 'Bruker (Fabricante)',
        fecha: '2020-04-20',
        duracion_horas: 24,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
      {
        id: 'cap-013',
        nombre: 'Metalografia Practica',
        institucion: 'CESMEC',
        fecha: '2021-01-10',
        duracion_horas: 40,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
    ],
  },
  {
    id: 'per-006',
    codigo: 'LAB-006',
    nombre: 'Pedro',
    apellido: 'Sanchez Munoz',
    email: 'psanchez@laboratorio.cl',
    telefono: '+56 9 3210 9876',
    cargo: 'laboratorista',
    fecha_ingreso: '2021-07-01',
    activo: true,
    foto: null,
    empresa: null,
    rut: null,
    proyectos: ['pry-5', 'pry-6'], // Asignado a END
    
    autorizaciones: [
      { id: 'end_ut', fecha_autorizacion: '2021-09-01', vigente: true },
      { id: 'end_pt', fecha_autorizacion: '2021-09-01', vigente: true },
      { id: 'end_mt', fecha_autorizacion: '2021-09-01', vigente: true },
      { id: 'prep_muestras', fecha_autorizacion: '2021-08-01', vigente: true },
    ],
    
    estudios: [
      {
        id: 'est-007',
        titulo: 'Tecnico en Ensayos No Destructivos',
        institucion: 'DUOC UC',
        fecha_obtencion: '2019-12-18',
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
      },
    ],
    
    capacitaciones: [
      {
        id: 'cap-014',
        nombre: 'UT Nivel II ASNT',
        institucion: 'ACENDE',
        fecha: '2021-08-15',
        duracion_horas: 80,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: '2026-08-15',
      },
      {
        id: 'cap-015',
        nombre: 'PT Nivel II ASNT',
        institucion: 'ACENDE',
        fecha: '2021-08-20',
        duracion_horas: 40,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: '2026-08-20',
      },
      {
        id: 'cap-016',
        nombre: 'MT Nivel II ASNT',
        institucion: 'ACENDE',
        fecha: '2021-08-25',
        duracion_horas: 40,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: '2026-08-25',
      },
    ],
  },
  {
    id: 'per-007',
    codigo: 'LAB-007',
    nombre: 'Luis',
    apellido: 'Morales Diaz',
    email: 'lmorales@laboratorio.cl',
    telefono: '+56 9 2109 8765',
    cargo: 'auxiliar',
    fecha_ingreso: '2022-01-10',
    activo: true,
    foto: null,
    empresa: null,
    rut: null,
    proyectos: ['pry-1', 'pry-2'], // Apoya en preparacion
    
    autorizaciones: [
      { id: 'prep_muestras', fecha_autorizacion: '2022-02-01', vigente: true },
      { id: 'prep_probetas', fecha_autorizacion: '2022-06-01', vigente: true },
    ],
    
    estudios: [
      {
        id: 'est-008',
        titulo: 'Tecnico en Mecanica Industrial',
        institucion: 'Liceo Industrial',
        fecha_obtencion: '2020-12-15',
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
      },
    ],
    
    capacitaciones: [
      {
        id: 'cap-017',
        nombre: 'Operacion Torno CNC',
        institucion: 'SENCE',
        fecha: '2022-03-15',
        duracion_horas: 40,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
      {
        id: 'cap-018',
        nombre: 'Preparacion de Probetas Metalicas',
        institucion: 'Interno',
        fecha: '2022-02-20',
        duracion_horas: 8,
        certificado_url: null,
        vigencia: null,
      },
    ],
  },
  {
    id: 'per-008',
    codigo: 'LAB-008',
    nombre: 'Ana',
    apellido: 'Lopez Ruiz',
    email: 'alopez@laboratorio.cl',
    telefono: '+56 9 1098 7654',
    cargo: 'auxiliar_admin',
    fecha_ingreso: '2021-03-01',
    activo: true,
    foto: null,
    empresa: null,
    rut: null,
    proyectos: [], // Admin no tiene proyectos directos
    
    autorizaciones: [
      { id: 'recep_muestras', fecha_autorizacion: '2021-03-15', vigente: true },
      { id: 'gestion_doc', fecha_autorizacion: '2021-03-15', vigente: true },
      { id: 'atencion_cliente', fecha_autorizacion: '2021-03-15', vigente: true },
    ],
    
    estudios: [
      {
        id: 'est-009',
        titulo: 'Tecnico en Administracion',
        institucion: 'AIEP',
        fecha_obtencion: '2019-12-20',
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
      },
    ],
    
    capacitaciones: [
      {
        id: 'cap-019',
        nombre: 'Atencion al Cliente',
        institucion: 'SENCE',
        fecha: '2021-04-10',
        duracion_horas: 16,
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
        vigencia: null,
      },
      {
        id: 'cap-020',
        nombre: 'Gestion Documental ISO 17025',
        institucion: 'Interno',
        fecha: '2021-05-15',
        duracion_horas: 8,
        certificado_url: null,
        vigencia: null,
      },
    ],
  },
  {
    id: 'per-009',
    codigo: 'LAB-009',
    nombre: 'Francisco',
    apellido: 'Herrera Castro',
    email: 'fherrera@laboratorio.cl',
    telefono: '+56 9 0987 6543',
    cargo: 'laboratorista',
    fecha_ingreso: '2018-05-01',
    activo: false, // Inactivo
    foto: null,
    empresa: null,
    rut: null,
    proyectos: [],
    
    autorizaciones: [
      { id: 'ens_traccion', fecha_autorizacion: '2018-06-01', vigente: false },
      { id: 'ens_dureza', fecha_autorizacion: '2018-06-01', vigente: false },
    ],
    
    estudios: [
      {
        id: 'est-010',
        titulo: 'Tecnico en Metalurgia',
        institucion: 'INACAP',
        fecha_obtencion: '2016-12-15',
        certificado_url: 'https://drive.google.com/file/d/xxx/view',
      },
    ],
    
    capacitaciones: [],
  },
  // ============================================
  // CLIENTES
  // ============================================
  {
    id: 'per-010',
    codigo: 'CLI-001',
    nombre: 'Andres',
    apellido: 'Fuentes Marin',
    email: 'afuentes@constructoratorre.cl',
    telefono: '+56 9 8888 1111',
    cargo: 'cliente',
    fecha_ingreso: '2023-01-15',
    activo: true,
    foto: null,
    empresa: 'Constructora Torre Norte S.A.',
    rut: '76.543.210-K',
    proyectos: ['pry-1', 'pry-2', 'pry-3'],
    autorizaciones: [],
    estudios: [],
    capacitaciones: [],
  },
  {
    id: 'per-011',
    codigo: 'CLI-002',
    nombre: 'Patricia',
    apellido: 'Mendez Rojas',
    email: 'pmendez@minerapacific.cl',
    telefono: '+56 9 7777 2222',
    cargo: 'cliente',
    fecha_ingreso: '2024-03-20',
    activo: true,
    foto: null,
    empresa: 'Minera Pacific Gold SpA',
    rut: '77.888.999-5',
    proyectos: ['pry-4'],
    autorizaciones: [],
    estudios: [],
    capacitaciones: [],
  },
  {
    id: 'per-012',
    codigo: 'CLI-003',
    nombre: 'Ricardo',
    apellido: 'Soto Villanueva',
    email: 'rsoto@petrochile.cl',
    telefono: '+56 9 6666 3333',
    cargo: 'cliente',
    fecha_ingreso: '2022-08-10',
    activo: true,
    foto: null,
    empresa: 'Petrochile Ltda.',
    rut: '78.111.222-3',
    proyectos: ['pry-5', 'pry-6'],
    autorizaciones: [],
    estudios: [],
    capacitaciones: [],
  },
  {
    id: 'per-013',
    codigo: 'CLI-004',
    nombre: 'Carmen',
    apellido: 'Diaz Ortega',
    email: 'cdiaz@acerosnorte.cl',
    telefono: '+56 9 5555 4444',
    cargo: 'cliente',
    fecha_ingreso: '2021-05-01',
    activo: false, // Cliente inactivo
    foto: null,
    empresa: 'Aceros del Norte S.A.',
    rut: '79.333.444-1',
    proyectos: [],
    autorizaciones: [],
    estudios: [],
    capacitaciones: [],
  },
];

// ============================================
// MODAL: DETALLE DE PERSONA
// ============================================

function DetallePersonaModal({ persona, onClose, proyectos }) {
  const [tabActiva, setTabActiva] = useState(persona.cargo === 'cliente' ? 'proyectos' : 'autorizaciones');
  const cargo = CARGOS[persona.cargo];
  const esCliente = persona.cargo === 'cliente';

  // Proyectos de esta persona
  const proyectosPersona = useMemo(() => {
    return proyectos.filter(p => persona.proyectos?.includes(p.id));
  }, [proyectos, persona.proyectos]);

  const tabs = esCliente ? [
    { id: 'proyectos', label: 'Proyectos', count: proyectosPersona.length },
  ] : [
    { id: 'autorizaciones', label: 'Autorizaciones', count: persona.autorizaciones?.length || 0 },
    { id: 'estudios', label: 'Estudios', count: persona.estudios?.length || 0 },
    { id: 'capacitaciones', label: 'Capacitaciones', count: persona.capacitaciones?.length || 0 },
    { id: 'proyectos', label: 'Proyectos', count: proyectosPersona.length },
  ];

  // Agrupar autorizaciones por categoria
  const autorizacionesPorCategoria = useMemo(() => {
    if (esCliente) return {};
    const grupos = {};
    (persona.autorizaciones || []).forEach(auth => {
      const catalogo = AUTORIZACIONES_CATALOGO[auth.id];
      if (catalogo) {
        const cat = catalogo.categoria;
        if (!grupos[cat]) grupos[cat] = [];
        grupos[cat].push({ ...auth, ...catalogo });
      }
    });
    return grupos;
  }, [persona.autorizaciones, esCliente]);

  return (
    <Modal isOpen={true} onClose={onClose} title={esCliente ? "Detalle de Cliente" : "Detalle de Personal"} width="800px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Cabecera con info basica */}
        <div style={{ display: 'flex', gap: '20px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
          {/* Avatar */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: cargo.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: '600',
            flexShrink: 0,
          }}>
            {persona.nombre[0]}{persona.apellido[0]}
          </div>
          
          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                {persona.nombre} {persona.apellido}
              </h3>
              <Badge color={persona.activo ? '#10B981' : '#EF4444'}>
                {persona.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Badge color={cargo.color}>{cargo.nombre}</Badge>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>({persona.codigo})</span>
            </div>
            {/* Info empresa para clientes */}
            {esCliente && persona.empresa && (
              <div style={{ marginBottom: '8px', padding: '8px 12px', backgroundColor: '#FDF4FF', borderRadius: '6px', border: '1px solid #F5D0FE' }}>
                <div style={{ fontWeight: '600', color: '#86198F' }}>{persona.empresa}</div>
                <div style={{ fontSize: '0.875rem', color: '#A21CAF' }}>RUT: {persona.rut}</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#6B7280' }}>Email: </span>
                <span>{persona.email}</span>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>Telefono: </span>
                <span>{persona.telefono}</span>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>{esCliente ? 'Cliente desde: ' : 'Ingreso: '}</span>
                <span>{new Date(persona.fecha_ingreso).toLocaleDateString('es-CL')}</span>
              </div>
              {!esCliente && (
                <div>
                  <span style={{ color: '#6B7280' }}>Antiguedad: </span>
                  <span>{Math.floor((new Date() - new Date(persona.fecha_ingreso)) / (365.25 * 24 * 60 * 60 * 1000))} anos</span>
                </div>
              )}
              {esCliente && (
                <div>
                  <span style={{ color: '#6B7280' }}>Proyectos: </span>
                  <span style={{ fontWeight: '600', color: '#EC4899' }}>{proyectosPersona.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderBottom: tabActiva === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                  color: tabActiva === tab.id ? '#3B82F6' : '#6B7280',
                  fontWeight: tabActiva === tab.id ? '600' : '400',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {tab.label}
                <span style={{
                  backgroundColor: tabActiva === tab.id ? '#DBEAFE' : '#F3F4F6',
                  color: tabActiva === tab.id ? '#3B82F6' : '#6B7280',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de tabs */}
        <div style={{ minHeight: '300px', maxHeight: '400px', overflow: 'auto' }}>
          {/* Tab Autorizaciones */}
          {tabActiva === 'autorizaciones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.keys(autorizacionesPorCategoria).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
                  No tiene autorizaciones registradas
                </div>
              ) : (
                Object.entries(autorizacionesPorCategoria).map(([categoria, autorizaciones]) => {
                  const catInfo = CATEGORIAS_AUTORIZACION[categoria];
                  return (
                    <div key={categoria}>
                      <h4 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '0.875rem', 
                        color: catInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: catInfo.color 
                        }}></span>
                        {catInfo.nombre}
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {autorizaciones.map(auth => (
                          <div
                            key={auth.id}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: auth.vigente ? '#F0FDF4' : '#FEF2F2',
                              border: '1px solid ' + (auth.vigente ? '#BBF7D0' : '#FECACA'),
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                            }}
                          >
                            <div style={{ fontWeight: '500', color: auth.vigente ? '#166534' : '#991B1B' }}>
                              {auth.nombre}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                              {auth.norma} | Desde: {new Date(auth.fecha_autorizacion).toLocaleDateString('es-CL')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab Estudios */}
          {tabActiva === 'estudios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(persona.estudios || []).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
                  No tiene estudios registrados
                </div>
              ) : (
                (persona.estudios || []).map(estudio => (
                  <div
                    key={estudio.id}
                    style={{
                      padding: '16px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      borderLeft: '4px solid #3B82F6',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>{estudio.titulo}</div>
                        <div style={{ color: '#6B7280', marginTop: '4px' }}>{estudio.institucion}</div>
                        <div style={{ fontSize: '0.875rem', color: '#9CA3AF', marginTop: '4px' }}>
                          Obtenido: {new Date(estudio.fecha_obtencion).toLocaleDateString('es-CL')}
                        </div>
                      </div>
                      {estudio.certificado_url && (
                        <a
                          href={estudio.certificado_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3B82F6',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                          }}
                        >
                          Ver Certificado
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab Capacitaciones */}
          {tabActiva === 'capacitaciones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(persona.capacitaciones || []).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
                  No tiene capacitaciones registradas
                </div>
              ) : (
                (persona.capacitaciones || []).map(cap => {
                  const vigente = !cap.vigencia || new Date(cap.vigencia) > new Date();
                  const diasRestantes = cap.vigencia 
                    ? Math.ceil((new Date(cap.vigencia) - new Date()) / (1000 * 60 * 60 * 24))
                    : null;
                  
                  return (
                    <div
                      key={cap.id}
                      style={{
                        padding: '16px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                        borderLeft: '4px solid ' + (vigente ? '#10B981' : '#EF4444'),
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '600' }}>{cap.nombre}</span>
                            {cap.vigencia && (
                              <Badge color={vigente ? (diasRestantes <= 90 ? '#F59E0B' : '#10B981') : '#EF4444'}>
                                {vigente 
                                  ? (diasRestantes <= 90 ? `Vence en ${diasRestantes}d` : 'Vigente')
                                  : 'Vencido'}
                              </Badge>
                            )}
                          </div>
                          <div style={{ color: '#6B7280', marginTop: '4px' }}>{cap.institucion}</div>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#9CA3AF', marginTop: '4px' }}>
                            <span>Fecha: {new Date(cap.fecha).toLocaleDateString('es-CL')}</span>
                            <span>Duracion: {cap.duracion_horas}h</span>
                            {cap.vigencia && (
                              <span>Vigencia: {new Date(cap.vigencia).toLocaleDateString('es-CL')}</span>
                            )}
                          </div>
                        </div>
                        {cap.certificado_url && (
                          <a
                            href={cap.certificado_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#10B981',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Ver Certificado
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab Proyectos */}
          {tabActiva === 'proyectos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {proyectosPersona.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
                  No tiene proyectos asociados
                </div>
              ) : (
                proyectosPersona.map(pry => (
                  <div
                    key={pry.id}
                    style={{
                      padding: '16px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      borderLeft: '4px solid ' + (pry.estado === 'activo' ? '#10B981' : '#6B7280'),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '600' }}>{pry.codigo}</span>
                          <Badge color={pry.estado === 'activo' ? '#10B981' : '#6B7280'}>
                            {pry.estado === 'activo' ? 'Activo' : 'Completado'}
                          </Badge>
                        </div>
                        <div style={{ color: '#374151', marginTop: '4px' }}>{pry.nombre}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Personal() {
  const { user } = useGoogleAuth();
  const [personal] = useState(MOCK_PERSONAL);
  const [proyectos] = useState(MOCK_PROYECTOS);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [filtroCargo, setFiltroCargo] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'interno', 'externo'
  const [filtroActivo, setFiltroActivo] = useState('activos');
  const [busqueda, setBusqueda] = useState('');
  const [vistaExpandida, setVistaExpandida] = useState(null);

  // Permisos
  const canEdit = user?.rol === 'admin' || user?.rol === 'coordinador';

  // Filtrar personal
  const personalFiltrado = useMemo(() => {
    return personal.filter(p => {
      // Filtro por estado activo
      if (filtroActivo === 'activos' && !p.activo) return false;
      if (filtroActivo === 'inactivos' && p.activo) return false;
      
      // Filtro por tipo (interno/externo)
      if (filtroTipo !== 'todos') {
        const cargoInfo = CARGOS[p.cargo];
        if (filtroTipo === 'interno' && cargoInfo?.tipo !== 'interno') return false;
        if (filtroTipo === 'externo' && cargoInfo?.tipo !== 'externo') return false;
      }
      
      // Filtro por cargo
      if (filtroCargo !== 'todos' && p.cargo !== filtroCargo) return false;
      
      // Filtro por busqueda
      if (busqueda) {
        const search = busqueda.toLowerCase();
        const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
        const codigo = p.codigo.toLowerCase();
        const empresa = (p.empresa || '').toLowerCase();
        if (!nombreCompleto.includes(search) && !codigo.includes(search) && !empresa.includes(search)) return false;
      }
      
      return true;
    });
  }, [personal, filtroCargo, filtroTipo, filtroActivo, busqueda]);

  // Stats por cargo
  const statsPorCargo = useMemo(() => {
    const stats = {};
    Object.keys(CARGOS).forEach(cargo => {
      stats[cargo] = personal.filter(p => p.cargo === cargo && p.activo).length;
    });
    return stats;
  }, [personal]);

  // Total activos
  const totalActivos = personal.filter(p => p.activo).length;

  return (
    <PageLayout title="Personal y Clientes">
      {/* Stats por cargo */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '12px', 
        marginBottom: '24px' 
      }}>
        {Object.entries(CARGOS).map(([key, cargo]) => (
          <Card 
            key={key}
            onClick={() => setFiltroCargo(filtroCargo === key ? 'todos' : key)}
            selected={filtroCargo === key}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: cargo.color,
              marginBottom: '8px'
            }}></div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: cargo.color }}>
              {statsPorCargo[key]}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', lineHeight: '1.2' }}>
              {cargo.nombre}
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros y busqueda */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Filtro tipo interno/externo */}
          <select
            value={filtroTipo}
            onChange={(e) => { setFiltroTipo(e.target.value); setFiltroCargo('todos'); }}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
            }}
          >
            <option value="todos">Todos los tipos</option>
            <option value="interno">Personal interno</option>
            <option value="externo">Clientes</option>
          </select>

          {/* Filtro activos/inactivos */}
          <select
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
            }}
          >
            <option value="todos">Todos</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>

          {/* Limpiar filtro cargo */}
          {filtroCargo !== 'todos' && (
            <button
              onClick={() => setFiltroCargo('todos')}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FEF3C7',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {CARGOS[filtroCargo]?.nombre}
              <span style={{ fontWeight: 'bold' }}>x</span>
            </button>
          )}

          <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            {personalFiltrado.length} de {totalActivos} activos
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Busqueda */}
          <input
            type="text"
            placeholder="Buscar por nombre, codigo o empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              width: '280px',
              fontSize: '0.875rem',
            }}
          />

          {/* Boton agregar (solo admin) */}
          {canEdit && (
            <button
              onClick={() => alert('Funcionalidad de agregar personal pendiente')}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#3B82F6',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
              }}
            >
              + Agregar Personal
            </button>
          )}
        </div>
      </div>

      {/* Tabla de personal */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Codigo</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Nombre</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Cargo / Empresa</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Autorizaciones</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Proyectos</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Estado</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {personalFiltrado.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
                  No se encontraron resultados
                </td>
              </tr>
            ) : (
              personalFiltrado.map((persona) => {
                const cargo = CARGOS[persona.cargo];
                const esCliente = cargo.tipo === 'externo';
                const autorizacionesVigentes = (persona.autorizaciones || []).filter(a => a.vigente).length;
                const capacitacionesConVigencia = (persona.capacitaciones || []).filter(c => c.vigencia);
                const capacitacionesPorVencer = capacitacionesConVigencia.filter(c => {
                  const dias = Math.ceil((new Date(c.vigencia) - new Date()) / (1000 * 60 * 60 * 24));
                  return dias > 0 && dias <= 90;
                }).length;
                const capacitacionesVencidas = capacitacionesConVigencia.filter(c => new Date(c.vigencia) < new Date()).length;
                const proyectosAsociados = (persona.proyectos || []).map(pId => proyectos.find(p => p.id === pId)).filter(Boolean);
                const proyectosActivos = proyectosAsociados.filter(p => p.estado === 'activo').length;
                const isExpanded = vistaExpandida === persona.id;

                return (
                  <>
                    <tr 
                      key={persona.id}
                      onClick={() => setVistaExpandida(isExpanded ? null : persona.id)}
                      style={{ 
                        borderBottom: isExpanded ? 'none' : '1px solid #E5E7EB',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? '#F0F9FF' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '500' }}>
                        {persona.codigo}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: cargo.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}>
                            {persona.nombre[0]}{persona.apellido[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                              {persona.nombre} {persona.apellido}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                              {persona.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <Badge color={cargo.color}>{cargo.nombre}</Badge>
                          {esCliente && persona.empresa && (
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                              {persona.empresa}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {esCliente ? (
                          <span style={{ color: '#9CA3AF' }}>-</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ 
                              fontWeight: '600', 
                              color: autorizacionesVigentes > 0 ? '#10B981' : '#6B7280' 
                            }}>
                              {autorizacionesVigentes}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>vigentes</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '500' }}>{proyectosAsociados.length}</span>
                          {proyectosActivos > 0 && (
                            <Badge color="#3B82F6">{proyectosActivos} activos</Badge>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge color={persona.activo ? '#10B981' : '#EF4444'}>
                          {persona.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPersona(persona);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #D1D5DB',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                    
                    {/* Fila expandida */}
                    {isExpanded && (
                      <tr key={`${persona.id}-expanded`}>
                        <td colSpan={7} style={{ 
                          padding: '0 16px 16px 16px', 
                          backgroundColor: '#F0F9FF',
                          borderBottom: '1px solid #E5E7EB',
                        }}>
                          <div style={{ marginTop: '8px' }}>
                            {esCliente ? (
                              <>
                                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                  PROYECTOS ASOCIADOS:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {proyectosAsociados.map(proy => {
                                    const estadoColors = {
                                      activo: '#3B82F6',
                                      completado: '#10B981',
                                      cancelado: '#EF4444',
                                      pendiente: '#F59E0B',
                                    };
                                    return (
                                      <span
                                        key={proy.id}
                                        style={{
                                          padding: '4px 8px',
                                          backgroundColor: 'white',
                                          border: '1px solid ' + (estadoColors[proy.estado] || '#D1D5DB'),
                                          borderRadius: '4px',
                                          fontSize: '0.75rem',
                                          color: estadoColors[proy.estado] || '#374151',
                                        }}
                                      >
                                        {proy.codigo} - {proy.nombre}
                                      </span>
                                    );
                                  })}
                                  {proyectosAsociados.length === 0 && (
                                    <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                      Sin proyectos asociados
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                  AUTORIZACIONES NOMINALES:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {(persona.autorizaciones || []).filter(a => a.vigente).map(auth => {
                                    const catalogo = AUTORIZACIONES_CATALOGO[auth.id];
                                    const catInfo = CATEGORIAS_AUTORIZACION[catalogo?.categoria];
                                    return (
                                      <span
                                        key={auth.id}
                                        style={{
                                          padding: '4px 8px',
                                          backgroundColor: 'white',
                                          border: '1px solid ' + (catInfo?.color || '#D1D5DB'),
                                          borderRadius: '4px',
                                          fontSize: '0.75rem',
                                          color: catInfo?.color || '#374151',
                                        }}
                                      >
                                        {catalogo?.nombre || auth.id}
                                      </span>
                                    );
                                  })}
                                  {(persona.autorizaciones || []).filter(a => a.vigente).length === 0 && (
                                    <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                      Sin autorizaciones vigentes
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal detalle */}
      {selectedPersona && (
        <DetallePersonaModal
          persona={selectedPersona}
          proyectos={proyectos}
          onClose={() => setSelectedPersona(null)}
        />
      )}
    </PageLayout>
  );
}
