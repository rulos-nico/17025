/**
 * PersonalRow - Fila de tabla para personal/cliente con vista expandida
 */

import { Fragment } from 'react';
import { Badge } from '../ui';
import {
  AUTORIZACIONES_CATALOGO,
  CATEGORIAS_AUTORIZACION,
  getCargoInfo,
} from '../../config/personal';
import styles from './PersonalRow.module.css';

export default function PersonalRow({
  persona,
  proyectos,
  isExpanded,
  onToggle,
  onViewDetail,
  onDelete,
  canEdit,
}) {
  const cargo = getCargoInfo(persona.cargo);
  const esCliente = cargo.tipo === 'externo';

  // Calculos de autorizaciones y capacitaciones
  const autorizacionesVigentes = (persona.autorizaciones || []).filter(a => a.vigente).length;

  // Proyectos asociados
  const proyectosAsociados = (persona.proyectos || [])
    .map(pId => proyectos.find(p => p.id === pId))
    .filter(Boolean);
  const proyectosActivos = proyectosAsociados.filter(p => p.estado === 'activo').length;

  return (
    <Fragment>
      <tr onClick={onToggle} className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}>
        {/* Codigo */}
        <td className={styles.cellCode}>{persona.codigo}</td>

        {/* Nombre con avatar */}
        <td className={styles.cell}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar} style={{ backgroundColor: cargo.color }}>
              {persona.nombre[0]}
              {persona.apellido?.[0] || ''}
            </div>
            <div>
              <div className={styles.personName}>
                {persona.nombre} {persona.apellido}
              </div>
              <div className={styles.personEmail}>{persona.email}</div>
            </div>
          </div>
        </td>

        {/* Cargo / Empresa */}
        <td className={styles.cell}>
          <div>
            <Badge color={cargo.color}>{cargo.nombre}</Badge>
            {esCliente && persona.empresa && (
              <div className={styles.empresaText}>{persona.empresa}</div>
            )}
          </div>
        </td>

        {/* Autorizaciones */}
        <td className={styles.cell}>
          {esCliente ? (
            <span className={styles.placeholder}>-</span>
          ) : (
            <div className={styles.authCount}>
              <span
                className={
                  autorizacionesVigentes > 0 ? styles.authNumberActive : styles.authNumberInactive
                }
              >
                {autorizacionesVigentes}
              </span>
              <span className={styles.authLabel}>vigentes</span>
            </div>
          )}
        </td>

        {/* Proyectos */}
        <td className={styles.cell}>
          <div className={styles.projectsContainer}>
            <span className={styles.projectCount}>{proyectosAsociados.length}</span>
            {proyectosActivos > 0 && <Badge color="#3B82F6">{proyectosActivos} activos</Badge>}
          </div>
        </td>

        {/* Estado */}
        <td className={styles.cell}>
          <Badge color={persona.activo ? '#10B981' : '#EF4444'}>
            {persona.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </td>

        {/* Acciones */}
        <td className={styles.cellCenter}>
          <div className={styles.actionsContainer}>
            <button
              onClick={e => {
                e.stopPropagation();
                onViewDetail();
              }}
              className={styles.detailButton}
            >
              Ver detalle
            </button>
            {canEdit && onDelete && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete(persona);
                }}
                className={styles.deleteButton}
              >
                Eliminar
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Fila expandida */}
      {isExpanded && (
        <tr className={styles.expandedRow}>
          <td colSpan={7} className={styles.expandedCell}>
            <div className={styles.expandedContent}>
              {esCliente ? (
                <ExpandedProyectos proyectos={proyectosAsociados} />
              ) : (
                <ExpandedAutorizaciones autorizaciones={persona.autorizaciones} />
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

// ============================================
// SUB-COMPONENTES
// ============================================

const ESTADO_COLORS = {
  activo: '#3B82F6',
  completado: '#10B981',
  cancelado: '#EF4444',
  pendiente: '#F59E0B',
};

function ExpandedProyectos({ proyectos }) {
  return (
    <>
      <div className={styles.expandedTitle}>PROYECTOS ASOCIADOS:</div>
      <div className={styles.tagContainer}>
        {proyectos.map(proy => (
          <span
            key={proy.id}
            className={styles.tag}
            style={{
              border: `1px solid ${ESTADO_COLORS[proy.estado] || '#D1D5DB'}`,
              color: ESTADO_COLORS[proy.estado] || '#374151',
            }}
          >
            {proy.codigo} - {proy.nombre}
          </span>
        ))}
        {proyectos.length === 0 && (
          <span className={styles.emptyText}>Sin proyectos asociados</span>
        )}
      </div>
    </>
  );
}

function ExpandedAutorizaciones({ autorizaciones }) {
  const autorizacionesVigentes = (autorizaciones || []).filter(a => a.vigente);

  return (
    <>
      <div className={styles.expandedTitle}>AUTORIZACIONES NOMINALES:</div>
      <div className={styles.tagContainer}>
        {autorizacionesVigentes.map(auth => {
          const catalogo = AUTORIZACIONES_CATALOGO[auth.id];
          const catInfo = CATEGORIAS_AUTORIZACION[catalogo?.categoria];
          return (
            <span
              key={auth.id}
              className={styles.tag}
              style={{
                border: `1px solid ${catInfo?.color || '#D1D5DB'}`,
                color: catInfo?.color || '#374151',
              }}
            >
              {catalogo?.nombre || auth.id}
            </span>
          );
        })}
        {autorizacionesVigentes.length === 0 && (
          <span className={styles.emptyText}>Sin autorizaciones vigentes</span>
        )}
      </div>
    </>
  );
}
