import { useState, useMemo, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge, Card, Modal } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { ClientesAPI, ProyectosAPI, PersonalInternoAPI } from '../services/apiService';

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
  anal_xrf: { id: 'anal_xrf', nombre: 'Analisis XRF', categoria: 'ensayo', norma: 'ASTM E1621' },

  // Metalografia
  metal_macro: {
    id: 'metal_macro',
    nombre: 'Macrografia',
    categoria: 'ensayo',
    norma: 'ASTM E340',
  },
  metal_micro: { id: 'metal_micro', nombre: 'Micrografia', categoria: 'ensayo', norma: 'ASTM E3' },

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
  end_pt: { id: 'end_pt', nombre: 'Liquidos Penetrantes', categoria: 'ensayo', norma: 'ASTM E165' },
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

const CATEGORIAS_AUTORIZACION = {
  ensayo: { nombre: 'Ensayos', color: '#10B981' },
  revision: { nombre: 'Revision', color: '#8B5CF6' },
  metrologia: { nombre: 'Metrologia', color: '#3B82F6' },
  preparacion: { nombre: 'Preparacion', color: '#F59E0B' },
  admin: { nombre: 'Administrativo', color: '#6B7280' },
};

// ============================================
// MODAL: DETALLE DE PERSONA
// ============================================

function DetallePersonaModal({ persona, onClose, proyectos }) {
  const [tabActiva, setTabActiva] = useState(
    persona.cargo === 'cliente' ? 'proyectos' : 'autorizaciones'
  );
  const cargo = CARGOS[persona.cargo] || {
    id: persona.cargo || 'desconocido',
    nombre: persona.cargo || 'Desconocido',
    tipo: 'interno',
    color: '#6B7280',
    nivel: 99,
    descripcion: 'Cargo no definido',
  };
  const esCliente = persona.cargo === 'cliente';

  // Proyectos de esta persona
  const proyectosPersona = useMemo(() => {
    return proyectos.filter(p => persona.proyectos?.includes(p.id));
  }, [proyectos, persona.proyectos]);

  const tabs = esCliente
    ? [{ id: 'proyectos', label: 'Proyectos', count: proyectosPersona.length }]
    : [
        {
          id: 'autorizaciones',
          label: 'Autorizaciones',
          count: persona.autorizaciones?.length || 0,
        },
        { id: 'estudios', label: 'Estudios', count: persona.estudios?.length || 0 },
        {
          id: 'capacitaciones',
          label: 'Capacitaciones',
          count: persona.capacitaciones?.length || 0,
        },
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={esCliente ? 'Detalle de Cliente' : 'Detalle de Personal'}
      width="800px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Cabecera con info basica */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            padding: '16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
          }}
        >
          {/* Avatar */}
          <div
            style={{
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
            }}
          >
            {persona.nombre[0]}
            {persona.apellido[0]}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}
            >
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
              <div
                style={{
                  marginBottom: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#FDF4FF',
                  borderRadius: '6px',
                  border: '1px solid #F5D0FE',
                }}
              >
                <div style={{ fontWeight: '600', color: '#86198F' }}>{persona.empresa}</div>
                <div style={{ fontSize: '0.875rem', color: '#A21CAF' }}>RUT: {persona.rut}</div>
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.875rem',
              }}
            >
              <div>
                <span style={{ color: '#6B7280' }}>Email: </span>
                <span>{persona.email}</span>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>Telefono: </span>
                <span>{persona.telefono}</span>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>
                  {esCliente ? 'Cliente desde: ' : 'Ingreso: '}
                </span>
                <span>{new Date(persona.fecha_ingreso).toLocaleDateString('es-CL')}</span>
              </div>
              {!esCliente && (
                <div>
                  <span style={{ color: '#6B7280' }}>Antiguedad: </span>
                  <span>
                    {Math.floor(
                      (new Date() - new Date(persona.fecha_ingreso)) /
                        (365.25 * 24 * 60 * 60 * 1000)
                    )}{' '}
                    anos
                  </span>
                </div>
              )}
              {esCliente && (
                <div>
                  <span style={{ color: '#6B7280' }}>Proyectos: </span>
                  <span style={{ fontWeight: '600', color: '#EC4899' }}>
                    {proyectosPersona.length}
                  </span>
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
                  borderBottom:
                    tabActiva === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                  color: tabActiva === tab.id ? '#3B82F6' : '#6B7280',
                  fontWeight: tabActiva === tab.id ? '600' : '400',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {tab.label}
                <span
                  style={{
                    backgroundColor: tabActiva === tab.id ? '#DBEAFE' : '#F3F4F6',
                    color: tabActiva === tab.id ? '#3B82F6' : '#6B7280',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                  }}
                >
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
                      <h4
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '0.875rem',
                          color: catInfo.color,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: catInfo.color,
                          }}
                        ></span>
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
                            <div
                              style={{
                                fontWeight: '500',
                                color: auth.vigente ? '#166534' : '#991B1B',
                              }}
                            >
                              {auth.nombre}
                            </div>
                            <div
                              style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}
                            >
                              {auth.norma} | Desde:{' '}
                              {new Date(auth.fecha_autorizacion).toLocaleDateString('es-CL')}
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
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>{estudio.titulo}</div>
                        <div style={{ color: '#6B7280', marginTop: '4px' }}>
                          {estudio.institucion}
                        </div>
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
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '600' }}>{cap.nombre}</span>
                            {cap.vigencia && (
                              <Badge
                                color={
                                  vigente
                                    ? diasRestantes <= 90
                                      ? '#F59E0B'
                                      : '#10B981'
                                    : '#EF4444'
                                }
                              >
                                {vigente
                                  ? diasRestantes <= 90
                                    ? `Vence en ${diasRestantes}d`
                                    : 'Vigente'
                                  : 'Vencido'}
                              </Badge>
                            )}
                          </div>
                          <div style={{ color: '#6B7280', marginTop: '4px' }}>
                            {cap.institucion}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: '16px',
                              fontSize: '0.875rem',
                              color: '#9CA3AF',
                              marginTop: '4px',
                            }}
                          >
                            <span>Fecha: {new Date(cap.fecha).toLocaleDateString('es-CL')}</span>
                            <span>Duracion: {cap.duracion_horas}h</span>
                            {cap.vigencia && (
                              <span>
                                Vigencia: {new Date(cap.vigencia).toLocaleDateString('es-CL')}
                              </span>
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
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid #E5E7EB',
            paddingTop: '16px',
          }}
        >
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
// MODAL: AGREGAR PERSONA
// ============================================

function AgregarPersonaModal({ isOpen, onClose, onSave }) {
  const [tipoPersona, setTipoPersona] = useState('interno'); // 'interno' o 'cliente'
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cargo: '',
    empresa: '',
    rut: '',
  });

  // Resetear formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      setTipoPersona('interno');
      setForm({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        cargo: '',
        empresa: '',
        rut: '',
      });
    }
  }, [isOpen]);

  // Obtener cargos internos (excluyendo cliente)
  const cargosInternos = Object.entries(CARGOS).filter(([key]) => key !== 'cliente');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const nuevaPersona = {
      id: `per-new-${Date.now()}`,
      codigo: tipoPersona === 'cliente' ? `CLI-${Date.now()}` : `LAB-${Date.now()}`,
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      telefono: form.telefono,
      cargo: tipoPersona === 'cliente' ? 'cliente' : form.cargo,
      fecha_ingreso: new Date().toISOString().split('T')[0],
      activo: true,
      foto: null,
      empresa: tipoPersona === 'cliente' ? form.empresa : null,
      rut: tipoPersona === 'cliente' ? form.rut : null,
      proyectos: [],
      autorizaciones: [],
      estudios: [],
      capacitaciones: [],
    };
    onSave(nuevaPersona);
    onClose();
  };

  const isValid =
    form.nombre.trim() &&
    form.email.trim() &&
    (tipoPersona === 'cliente' ? form.empresa.trim() : form.cargo);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Persona" width="550px">
      <form onSubmit={handleSubmit}>
        {/* Selector de tipo */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: '#374151',
            }}
          >
            Tipo de Persona
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setTipoPersona('interno')}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: `2px solid ${tipoPersona === 'interno' ? '#3B82F6' : '#E5E7EB'}`,
                backgroundColor: tipoPersona === 'interno' ? '#EFF6FF' : 'white',
                color: tipoPersona === 'interno' ? '#1D4ED8' : '#6B7280',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              Personal Interno
            </button>
            <button
              type="button"
              onClick={() => setTipoPersona('cliente')}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: `2px solid ${tipoPersona === 'cliente' ? '#EC4899' : '#E5E7EB'}`,
                backgroundColor: tipoPersona === 'cliente' ? '#FDF2F8' : 'white',
                color: tipoPersona === 'cliente' ? '#BE185D' : '#6B7280',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              Cliente Externo
            </button>
          </div>
        </div>

        {/* Campos comunes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontWeight: '500',
                fontSize: '0.875rem',
              }}
            >
              Nombre *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => handleChange('nombre', e.target.value)}
              placeholder="Ej: Juan"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontWeight: '500',
                fontSize: '0.875rem',
              }}
            >
              Apellido
            </label>
            <input
              type="text"
              value={form.apellido}
              onChange={e => handleChange('apellido', e.target.value)}
              placeholder="Ej: Perez Silva"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontWeight: '500',
                fontSize: '0.875rem',
              }}
            >
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="correo@ejemplo.cl"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontWeight: '500',
                fontSize: '0.875rem',
              }}
            >
              Telefono
            </label>
            <input
              type="tel"
              value={form.telefono}
              onChange={e => handleChange('telefono', e.target.value)}
              placeholder="+56 9 1234 5678"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        {/* Campos condicionales */}
        {tipoPersona === 'interno' ? (
          <div style={{ marginTop: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontWeight: '500',
                fontSize: '0.875rem',
              }}
            >
              Cargo / Rol *
            </label>
            <select
              value={form.cargo}
              onChange={e => handleChange('cargo', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
                backgroundColor: 'white',
              }}
            >
              <option value="">Seleccionar cargo...</option>
              {cargosInternos.map(([key, cargo]) => (
                <option key={key} value={key}>
                  {cargo.nombre}
                </option>
              ))}
            </select>
            {form.cargo && CARGOS[form.cargo] && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#6B7280',
                }}
              >
                {CARGOS[form.cargo].descripcion}
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginTop: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                }}
              >
                Empresa *
              </label>
              <input
                type="text"
                value={form.empresa}
                onChange={e => handleChange('empresa', e.target.value)}
                placeholder="Nombre de la empresa"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                }}
              >
                RUT Empresa
              </label>
              <input
                type="text"
                value={form.rut}
                onChange={e => handleChange('rut', e.target.value)}
                placeholder="76.123.456-7"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </>
        )}

        {/* Botones */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #E5E7EB',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isValid}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isValid ? '#3B82F6' : '#9CA3AF',
              color: 'white',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              fontSize: '0.875rem',
            }}
          >
            Agregar Persona
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Personal() {
  const { user } = useAuth();
  const [personal, setPersonal] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [filtroCargo, setFiltroCargo] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'interno', 'externo'
  const [filtroActivo, setFiltroActivo] = useState('activos');
  const [busqueda, setBusqueda] = useState('');
  const [vistaExpandida, setVistaExpandida] = useState(null);
  const [showAgregarModal, setShowAgregarModal] = useState(false);

  // Handler para agregar persona (usa API para personal interno y clientes)
  const handleAgregarPersona = async nuevaPersona => {
    try {
      if (nuevaPersona.cargo === 'cliente') {
        // Crear cliente en la API
        const clienteData = {
          nombre: nuevaPersona.empresa || nuevaPersona.nombre,
          rut: nuevaPersona.rut,
          email: nuevaPersona.email,
          telefono: nuevaPersona.telefono,
          contacto_nombre: `${nuevaPersona.nombre} ${nuevaPersona.apellido}`.trim(),
          contacto_email: nuevaPersona.email,
          contacto_telefono: nuevaPersona.telefono,
        };
        const clienteCreado = await ClientesAPI.create(clienteData);

        // Convertir a formato de persona para la UI
        const personaCliente = {
          id: clienteCreado.id,
          codigo: clienteCreado.codigo,
          nombre: clienteCreado.contacto_nombre || clienteCreado.nombre,
          apellido: '',
          email: clienteCreado.contacto_email || clienteCreado.email,
          telefono: clienteCreado.contacto_telefono || clienteCreado.telefono,
          cargo: 'cliente',
          fecha_ingreso: clienteCreado.created_at?.split('T')[0] || '',
          activo: clienteCreado.activo,
          foto: null,
          empresa: clienteCreado.nombre,
          rut: clienteCreado.rut,
          proyectos: [],
          autorizaciones: [],
          estudios: [],
          capacitaciones: [],
        };
        setPersonal(prev => [...prev, personaCliente]);
      } else {
        // Crear personal interno en la API
        const personalData = {
          nombre: nuevaPersona.nombre,
          apellido: nuevaPersona.apellido || '',
          cargo: nuevaPersona.cargo,
          departamento: CARGOS[nuevaPersona.cargo]?.nombre || 'General',
          email: nuevaPersona.email,
          telefono: nuevaPersona.telefono || null,
        };
        const personalCreado = await PersonalInternoAPI.create(personalData);

        // Convertir a formato de persona para la UI
        const personaInterno = {
          id: personalCreado.id,
          codigo: personalCreado.codigo,
          nombre: personalCreado.nombre,
          apellido: personalCreado.apellido || '',
          email: personalCreado.email,
          telefono: personalCreado.telefono || '',
          cargo: personalCreado.cargo,
          departamento: personalCreado.departamento,
          fecha_ingreso: personalCreado.created_at?.split('T')[0] || '',
          activo: personalCreado.activo,
          foto: null,
          empresa: null,
          rut: null,
          proyectos: [],
          autorizaciones: [],
          estudios: [],
          capacitaciones: [],
        };
        setPersonal(prev => [...prev, personaInterno]);
      }
    } catch (err) {
      console.error('Error creando persona:', err);
      alert('Error al crear persona: ' + err.message);
    }
  };

  // Cargar clientes, personal interno y proyectos desde API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientesRes, personalInternoRes, proyectosRes] = await Promise.all([
          ClientesAPI.list(),
          PersonalInternoAPI.list().catch(() => []), // Si falla, retorna array vacío
          ProyectosAPI.list(),
        ]);

        // Convertir clientes de API al formato de "persona" para la UI
        const clientesComoPersonas = (clientesRes || []).map(cliente => ({
          id: cliente.id,
          codigo: cliente.codigo,
          nombre: cliente.contacto_nombre || cliente.nombre,
          apellido: '', // La API no tiene apellido separado
          email: cliente.contacto_email || cliente.email,
          telefono: cliente.contacto_telefono || cliente.telefono,
          cargo: 'cliente',
          fecha_ingreso: cliente.created_at?.split('T')[0] || '',
          activo: cliente.activo,
          foto: null,
          empresa: cliente.nombre,
          rut: cliente.rut,
          proyectos: [], // Se llenará abajo
          autorizaciones: [],
          estudios: [],
          capacitaciones: [],
        }));

        // Convertir personal interno de API al formato de "persona" para la UI
        const personalInternoComoPersonas = (personalInternoRes || []).map(p => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          apellido: p.apellido || '',
          email: p.email,
          telefono: p.telefono || '',
          cargo: p.cargo,
          departamento: p.departamento,
          fecha_ingreso: p.created_at?.split('T')[0] || '',
          activo: p.activo,
          foto: null,
          empresa: null,
          rut: null,
          proyectos: [], // Por ahora sin proyectos asignados
          autorizaciones: [],
          estudios: [],
          capacitaciones: [],
        }));

        // Mapear proyectos y asignarlos a clientes
        const proyectosMapeados = (proyectosRes || []).map(p => ({
          ...p,
          clienteId: p.cliente_id || p.clienteId,
        }));

        // Asignar proyectos a cada cliente
        clientesComoPersonas.forEach(cliente => {
          cliente.proyectos = proyectosMapeados
            .filter(p => p.clienteId === cliente.id)
            .map(p => p.id);
        });

        // Combinar personal interno y clientes
        setPersonal([...personalInternoComoPersonas, ...clientesComoPersonas]);
        setProyectos(proyectosMapeados);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setPersonal([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
        const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
        const codigo = (p.codigo || '').toLowerCase();
        const empresa = (p.empresa || '').toLowerCase();
        if (
          !nombreCompleto.includes(search) &&
          !codigo.includes(search) &&
          !empresa.includes(search)
        )
          return false;
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

  if (loading) {
    return (
      <PageLayout title="Personal y Clientes">
        <div style={{ textAlign: 'center', padding: '48px' }}>Cargando...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Personal y Clientes">
      {/* Stats por cargo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {Object.entries(CARGOS).map(([key, cargo]) => (
          <Card
            key={key}
            onClick={() => setFiltroCargo(filtroCargo === key ? 'todos' : key)}
            selected={filtroCargo === key}
            style={{ cursor: 'pointer' }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: cargo.color,
                marginBottom: '8px',
              }}
            ></div>
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Filtro tipo interno/externo */}
          <select
            value={filtroTipo}
            onChange={e => {
              setFiltroTipo(e.target.value);
              setFiltroCargo('todos');
            }}
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
            onChange={e => setFiltroActivo(e.target.value)}
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
            onChange={e => setBusqueda(e.target.value)}
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
              onClick={() => setShowAgregarModal(true)}
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
              + Agregar Persona
            </button>
          )}
        </div>
      </div>

      {/* Tabla de personal */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB' }}>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                }}
              >
                Codigo
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                }}
              >
                Nombre
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                }}
              >
                Cargo / Empresa
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                }}
              >
                Autorizaciones
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                }}
              >
                Proyectos
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                }}
              >
                Estado
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#374151',
                }}
              >
                Acciones
              </th>
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
              personalFiltrado.map(persona => {
                const cargo = CARGOS[persona.cargo] || {
                  id: persona.cargo || 'desconocido',
                  nombre: persona.cargo || 'Desconocido',
                  tipo: 'interno',
                  color: '#6B7280',
                  nivel: 99,
                  descripcion: 'Cargo no definido',
                };
                const esCliente = cargo.tipo === 'externo';
                const autorizacionesVigentes = (persona.autorizaciones || []).filter(
                  a => a.vigente
                ).length;
                const capacitacionesConVigencia = (persona.capacitaciones || []).filter(
                  c => c.vigencia
                );
                const capacitacionesPorVencer = capacitacionesConVigencia.filter(c => {
                  const dias = Math.ceil(
                    (new Date(c.vigencia) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  return dias > 0 && dias <= 90;
                }).length;
                const capacitacionesVencidas = capacitacionesConVigencia.filter(
                  c => new Date(c.vigencia) < new Date()
                ).length;
                const proyectosAsociados = (persona.proyectos || [])
                  .map(pId => proyectos.find(p => p.id === pId))
                  .filter(Boolean);
                const proyectosActivos = proyectosAsociados.filter(
                  p => p.estado === 'activo'
                ).length;
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
                          <div
                            style={{
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
                            }}
                          >
                            {persona.nombre[0]}
                            {persona.apellido[0]}
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
                            <div
                              style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}
                            >
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
                            <span
                              style={{
                                fontWeight: '600',
                                color: autorizacionesVigentes > 0 ? '#10B981' : '#6B7280',
                              }}
                            >
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
                          onClick={e => {
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
                        <td
                          colSpan={7}
                          style={{
                            padding: '0 16px 16px 16px',
                            backgroundColor: '#F0F9FF',
                            borderBottom: '1px solid #E5E7EB',
                          }}
                        >
                          <div style={{ marginTop: '8px' }}>
                            {esCliente ? (
                              <>
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: '8px',
                                  }}
                                >
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
                                          border:
                                            '1px solid ' + (estadoColors[proy.estado] || '#D1D5DB'),
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
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: '8px',
                                  }}
                                >
                                  AUTORIZACIONES NOMINALES:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {(persona.autorizaciones || [])
                                    .filter(a => a.vigente)
                                    .map(auth => {
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
                                  {(persona.autorizaciones || []).filter(a => a.vigente).length ===
                                    0 && (
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

      {/* Modal agregar persona */}
      <AgregarPersonaModal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onSave={handleAgregarPersona}
      />
    </PageLayout>
  );
}
