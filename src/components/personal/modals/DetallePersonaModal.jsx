/**
 * DetallePersonaModal - Modal para mostrar detalle de una persona (personal interno o cliente)
 *
 * Incluye tabs para autorizaciones, estudios, capacitaciones y proyectos
 */

import { useState, useMemo } from 'react';
import { Modal, Badge } from '../../ui';
import {
  AUTORIZACIONES_CATALOGO,
  CATEGORIAS_AUTORIZACION,
  getCargoInfo,
} from '../../../config/personal';
import styles from './DetallePersonaModal.module.css';

export default function DetallePersonaModal({ persona, onClose, proyectos }) {
  const [tabActiva, setTabActiva] = useState(
    persona.cargo === 'cliente' ? 'proyectos' : 'autorizaciones'
  );
  const cargo = getCargoInfo(persona.cargo);
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
      <div className={styles.container}>
        {/* Cabecera con info basica */}
        <div className={styles.header}>
          {/* Avatar */}
          <div className={styles.avatar} style={{ backgroundColor: cargo.color }}>
            {persona.nombre[0]}
            {persona.apellido[0]}
          </div>

          {/* Info */}
          <div className={styles.infoSection}>
            <div className={styles.nameRow}>
              <h3 className={styles.name}>
                {persona.nombre} {persona.apellido}
              </h3>
              <Badge color={persona.activo ? '#10B981' : '#EF4444'}>
                {persona.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div className={styles.cargoRow}>
              <Badge color={cargo.color}>{cargo.nombre}</Badge>
              <span className={styles.codigo}>({persona.codigo})</span>
            </div>
            {/* Info empresa para clientes */}
            {esCliente && persona.empresa && (
              <div className={styles.empresaBox}>
                <div className={styles.empresaNombre}>{persona.empresa}</div>
                <div className={styles.empresaRut}>RUT: {persona.rut}</div>
              </div>
            )}
            <div className={styles.infoGrid}>
              <div>
                <span className={styles.infoLabel}>Email: </span>
                <span className={styles.infoValue}>{persona.email}</span>
              </div>
              <div>
                <span className={styles.infoLabel}>Telefono: </span>
                <span className={styles.infoValue}>{persona.telefono}</span>
              </div>
              <div>
                <span className={styles.infoLabel}>
                  {esCliente ? 'Cliente desde: ' : 'Ingreso: '}
                </span>
                <span className={styles.infoValue}>
                  {new Date(persona.fecha_ingreso).toLocaleDateString('es-CL')}
                </span>
              </div>
              {!esCliente && (
                <div>
                  <span className={styles.infoLabel}>Antiguedad: </span>
                  <span className={styles.infoValue}>
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
                  <span className={styles.infoLabel}>Proyectos: </span>
                  <span className={styles.infoValueHighlight}>{proyectosPersona.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsList}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={tabActiva === tab.id ? styles.tabActive : styles.tab}
              >
                {tab.label}
                <span className={tabActiva === tab.id ? styles.tabCountActive : styles.tabCount}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de tabs */}
        <div className={styles.tabContent}>
          {/* Tab Autorizaciones */}
          {tabActiva === 'autorizaciones' && (
            <TabAutorizaciones autorizacionesPorCategoria={autorizacionesPorCategoria} />
          )}

          {/* Tab Estudios */}
          {tabActiva === 'estudios' && <TabEstudios estudios={persona.estudios} />}

          {/* Tab Capacitaciones */}
          {tabActiva === 'capacitaciones' && (
            <TabCapacitaciones capacitaciones={persona.capacitaciones} />
          )}

          {/* Tab Proyectos */}
          {tabActiva === 'proyectos' && <TabProyectos proyectos={proyectosPersona} />}
        </div>

        {/* Botones */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.buttonSecondary}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// SUB-COMPONENTES DE TABS
// ============================================

function TabAutorizaciones({ autorizacionesPorCategoria }) {
  if (Object.keys(autorizacionesPorCategoria).length === 0) {
    return <div className={styles.emptyState}>No tiene autorizaciones registradas</div>;
  }

  return (
    <div className={styles.sectionList}>
      {Object.entries(autorizacionesPorCategoria).map(([categoria, autorizaciones]) => {
        const catInfo = CATEGORIAS_AUTORIZACION[categoria];
        return (
          <div key={categoria}>
            <h4 className={styles.categoryHeader} style={{ color: catInfo.color }}>
              <span className={styles.categoryDot} style={{ backgroundColor: catInfo.color }} />
              {catInfo.nombre}
            </h4>
            <div className={styles.tagsContainer}>
              {autorizaciones.map(auth => (
                <div
                  key={auth.id}
                  className={auth.vigente ? styles.authCardVigente : styles.authCardNoVigente}
                >
                  <div className={auth.vigente ? styles.authNameVigente : styles.authNameNoVigente}>
                    {auth.nombre}
                  </div>
                  <div className={styles.authMeta}>
                    {auth.norma} | Desde:{' '}
                    {new Date(auth.fecha_autorizacion).toLocaleDateString('es-CL')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabEstudios({ estudios }) {
  if ((estudios || []).length === 0) {
    return <div className={styles.emptyState}>No tiene estudios registrados</div>;
  }

  return (
    <div className={styles.itemList}>
      {(estudios || []).map(estudio => (
        <div key={estudio.id} className={styles.itemCard}>
          <div className={styles.itemHeader}>
            <div className={styles.itemContent}>
              <div className={styles.itemTitle}>{estudio.titulo}</div>
              <div className={styles.itemSubtitle}>{estudio.institucion}</div>
              <div className={styles.itemMeta}>
                Obtenido: {new Date(estudio.fecha_obtencion).toLocaleDateString('es-CL')}
              </div>
            </div>
            {estudio.certificado_url && (
              <a
                href={estudio.certificado_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkButtonPrimary}
              >
                Ver Certificado
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabCapacitaciones({ capacitaciones }) {
  if ((capacitaciones || []).length === 0) {
    return <div className={styles.emptyState}>No tiene capacitaciones registradas</div>;
  }

  return (
    <div className={styles.itemList}>
      {(capacitaciones || []).map(cap => {
        const vigente = !cap.vigencia || new Date(cap.vigencia) > new Date();
        const diasRestantes = cap.vigencia
          ? Math.ceil((new Date(cap.vigencia) - new Date()) / (1000 * 60 * 60 * 24))
          : null;

        return (
          <div key={cap.id} className={vigente ? styles.itemCardSuccess : styles.itemCardError}>
            <div className={styles.itemHeader}>
              <div className={styles.itemContent}>
                <div className={styles.itemTitleRow}>
                  <span className={styles.itemTitle}>{cap.nombre}</span>
                  {cap.vigencia && (
                    <Badge
                      color={vigente ? (diasRestantes <= 90 ? '#F59E0B' : '#10B981') : '#EF4444'}
                    >
                      {vigente
                        ? diasRestantes <= 90
                          ? `Vence en ${diasRestantes}d`
                          : 'Vigente'
                        : 'Vencido'}
                    </Badge>
                  )}
                </div>
                <div className={styles.itemSubtitle}>{cap.institucion}</div>
                <div className={styles.itemMetaRow}>
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
                  className={styles.linkButtonSuccess}
                >
                  Ver Certificado
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabProyectos({ proyectos }) {
  if (proyectos.length === 0) {
    return <div className={styles.emptyState}>No tiene proyectos asociados</div>;
  }

  return (
    <div className={styles.itemList}>
      {proyectos.map(pry => (
        <div
          key={pry.id}
          className={pry.estado === 'activo' ? styles.itemCardSuccess : styles.itemCardNeutral}
        >
          <div className={styles.itemHeader}>
            <div className={styles.itemContent}>
              <div className={styles.itemTitleRow}>
                <span className={styles.itemTitle}>{pry.codigo}</span>
                <Badge color={pry.estado === 'activo' ? '#10B981' : '#6B7280'}>
                  {pry.estado === 'activo' ? 'Activo' : 'Completado'}
                </Badge>
              </div>
              <div className={styles.itemSubtitle}>{pry.nombre}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
