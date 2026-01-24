const equiposExample = [
  {
    id: 'eq-1',
    identificado: 'EQ-001',
    marca: 'IngetecCo',
    modelo: 'INC-1000',
    numero_serie: 'SN-AX12345',
    ubicacion: 'Laboratorio A',
    estado: 'pendiente',
    ultima_comprobacion: '2025-12-01',
    ultima_calibracion: '2025-06-10',
    detalle: 'Equipo principal para ensayos mecánicos. Requiere revisión de sensores.'
  },
  {
    id: 'eq-2',
    identificado: 'EQ-002',
    marca: 'MarcaPlus',
    modelo: 'MP-42',
    numero_serie: 'SN-BX98765',
    ubicacion: 'Sala 2',
    estado: 'en_proceso',
    ultima_comprobacion: '2026-01-10',
    ultima_calibracion: '2025-11-12',
    detalle: 'Máquina secundaria, calibración dentro de tolerancias.'
  },
  {
    id: 'eq-3',
    identificado: 'EQ-003',
    marca: 'CalibraTech',
    modelo: 'CT-88',
    numero_serie: 'SN-CZ56432',
    ubicacion: 'Bodega',
    estado: 'completado',
    ultima_comprobacion: '2025-08-20',
    ultima_calibracion: '2025-08-01',
    detalle: 'Equipo fuera de servicio temporalmente por mantenimiento.'
  }
];

export default equiposExample;
