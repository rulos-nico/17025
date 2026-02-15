/**
 * AgregarPersonaModal - Modal para agregar nuevo personal interno o cliente
 */

import { useState, useEffect } from 'react';
import { Modal } from '../../ui';
import { CARGOS, getCargosInternos } from '../../../config/personal';
import styles from './AgregarPersonaModal.module.css';

export default function AgregarPersonaModal({ isOpen, onClose, onSave }) {
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
  const cargosInternos = getCargosInternos();

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
        <div className={styles.tipoSection}>
          <label className={styles.tipoLabel}>Tipo de Persona</label>
          <div className={styles.tipoButtons}>
            <button
              type="button"
              onClick={() => setTipoPersona('interno')}
              className={tipoPersona === 'interno' ? styles.tipoButtonInterno : styles.tipoButton}
            >
              Personal Interno
            </button>
            <button
              type="button"
              onClick={() => setTipoPersona('cliente')}
              className={tipoPersona === 'cliente' ? styles.tipoButtonCliente : styles.tipoButton}
            >
              Cliente Externo
            </button>
          </div>
        </div>

        {/* Campos comunes */}
        <div className={styles.formGrid}>
          <div>
            <label className={styles.label}>Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => handleChange('nombre', e.target.value)}
              placeholder="Ej: Juan"
              required
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label}>Apellido</label>
            <input
              type="text"
              value={form.apellido}
              onChange={e => handleChange('apellido', e.target.value)}
              placeholder="Ej: Perez Silva"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGridSpaced}>
          <div>
            <label className={styles.label}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="correo@ejemplo.cl"
              required
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label}>Telefono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={e => handleChange('telefono', e.target.value)}
              placeholder="+56 9 1234 5678"
              className={styles.input}
            />
          </div>
        </div>

        {/* Campos condicionales */}
        {tipoPersona === 'interno' ? (
          <div className={styles.formField}>
            <label className={styles.label}>Cargo / Rol *</label>
            <select
              value={form.cargo}
              onChange={e => handleChange('cargo', e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Seleccionar cargo...</option>
              {cargosInternos.map(([key, cargo]) => (
                <option key={key} value={key}>
                  {cargo.nombre}
                </option>
              ))}
            </select>
            {form.cargo && CARGOS[form.cargo] && (
              <div className={styles.cargoHint}>{CARGOS[form.cargo].descripcion}</div>
            )}
          </div>
        ) : (
          <>
            <div className={styles.formField}>
              <label className={styles.label}>Empresa *</label>
              <input
                type="text"
                value={form.empresa}
                onChange={e => handleChange('empresa', e.target.value)}
                placeholder="Nombre de la empresa"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>RUT Empresa</label>
              <input
                type="text"
                value={form.rut}
                onChange={e => handleChange('rut', e.target.value)}
                placeholder="76.123.456-7"
                className={styles.input}
              />
            </div>
          </>
        )}

        {/* Botones */}
        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.buttonSecondary}>
            Cancelar
          </button>
          <button type="submit" disabled={!isValid} className={styles.buttonPrimary}>
            Agregar Persona
          </button>
        </div>
      </form>
    </Modal>
  );
}
