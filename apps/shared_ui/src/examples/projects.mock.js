const projectsExample = [
  {
    id: 'p1',
    codigo: 'PRJ-001',
    nombre: 'Proyecto Alfa',
    cliente: 'Cliente A',
    estado: 'activo',
    fecha_inicio: '2026-01-01',
    fecha_fin: '',
    perforaciones: [
      {
        id: 'f1',
        codigo_perforacion: 'F-001',
        descripcion: 'Perforación sector norte',
        fecha_solicitud: '2026-01-05',
        ensayos: [
          { id: 'e1', codigo_ensayo: 'E-001', tipo: 'traccion', estado: 'pendiente', fecha_programada: '2026-02-01', responsable: 'Ana' },
          { id: 'e2', codigo_ensayo: 'E-002', tipo: 'dureza', estado: 'completado', fecha_programada: '2026-01-15', responsable: 'Luis' },
        ],
      },
      {
        id: 'f2',
        codigo_perforacion: 'F-002',
        descripcion: 'Perforación sector sur',
        fecha_solicitud: '2026-01-10',
        ensayos: [
          { id: 'e3', codigo_ensayo: 'E-003', tipo: 'impacto', estado: 'en_proceso', fecha_programada: '2026-02-05', responsable: 'Carlos' },
        ],
      },
    ],
  },
  {
    id: 'p2',
    codigo: 'PRJ-002',
    nombre: 'Proyecto Beta',
    cliente: 'Cliente B',
    estado: 'completado',
    fecha_inicio: '2025-10-01',
    fecha_fin: '2026-01-20',
    perforaciones: [
      {
        id: 'f3',
        codigo_perforacion: 'F-003',
        descripcion: 'Perforación central',
        fecha_solicitud: '2025-11-05',
        ensayos: [
          { id: 'e4', codigo_ensayo: 'E-004', tipo: 'quimico_xrf', estado: 'completado', fecha_programada: '2025-12-01', responsable: 'María' },
        ],
      },
    ],
  },
];

export default projectsExample;
