/**
 * Entidad: Proyecto
 * Representa un proyecto de cliente con sus perforaciones y ensayos
 *
 * Reglas de negocio:
 * - Un proyecto debe tener código único
 * - Un proyecto debe estar asociado a un cliente
 * - Las transiciones de estado siguen reglas definidas
 */

import { EstadoProyecto, puedeTransicionar } from '../value-objects/EstadoProyecto';

/**
 * Props inmutables del proyecto
 */
export interface ProyectoProps {
  id: string;
  codigo: string;
  nombre: string;
  clienteId: string;
  estado: EstadoProyecto;
  fechaInicio: Date;
  fechaFin?: Date;
  descripcion?: string;
  ubicacion?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Props para crear un nuevo proyecto
 */
export type CrearProyectoProps = Omit<
  ProyectoProps,
  'id' | 'createdAt' | 'updatedAt' | 'estado' | 'fechaFin'
> & {
  id?: string;
};

/**
 * Props para actualizar un proyecto
 */
export type ActualizarProyectoProps = Partial<
  Pick<ProyectoProps, 'nombre' | 'descripcion' | 'ubicacion'>
>;

/**
 * Entidad Proyecto
 * Encapsula la lógica de negocio relacionada con proyectos
 */
export class Proyecto {
  private constructor(private props: ProyectoProps) {}

  // ============================================
  // Factory Methods
  // ============================================

  /**
   * Crea un nuevo proyecto con validaciones
   */
  static create(props: CrearProyectoProps): Proyecto {
    // Validaciones de negocio
    if (!props.codigo || props.codigo.trim() === '') {
      throw new Error('El código del proyecto es requerido');
    }

    if (!props.nombre || props.nombre.trim() === '') {
      throw new Error('El nombre del proyecto es requerido');
    }

    if (!props.clienteId) {
      throw new Error('El cliente es requerido');
    }

    if (!props.fechaInicio) {
      throw new Error('La fecha de inicio es requerida');
    }

    const now = new Date();

    return new Proyecto({
      id: props.id ?? crypto.randomUUID(),
      codigo: props.codigo.trim().toUpperCase(),
      nombre: props.nombre.trim(),
      clienteId: props.clienteId,
      estado: EstadoProyecto.ACTIVO,
      fechaInicio: props.fechaInicio,
      fechaFin: undefined,
      descripcion: props.descripcion?.trim(),
      ubicacion: props.ubicacion?.trim(),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstituye un proyecto desde persistencia (sin validaciones)
   */
  static fromPersistence(props: ProyectoProps): Proyecto {
    return new Proyecto(props);
  }

  // ============================================
  // Getters (acceso de solo lectura)
  // ============================================

  get id(): string {
    return this.props.id;
  }

  get codigo(): string {
    return this.props.codigo;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get clienteId(): string {
    return this.props.clienteId;
  }

  get estado(): EstadoProyecto {
    return this.props.estado;
  }

  get fechaInicio(): Date {
    return this.props.fechaInicio;
  }

  get fechaFin(): Date | undefined {
    return this.props.fechaFin;
  }

  get descripcion(): string | undefined {
    return this.props.descripcion;
  }

  get ubicacion(): string | undefined {
    return this.props.ubicacion;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ============================================
  // Queries (preguntas sobre el estado)
  // ============================================

  /**
   * Verifica si el proyecto está activo
   */
  estaActivo(): boolean {
    return this.props.estado === EstadoProyecto.ACTIVO;
  }

  /**
   * Verifica si el proyecto está en un estado terminal
   */
  estaFinalizado(): boolean {
    return (
      this.props.estado === EstadoProyecto.COMPLETADO ||
      this.props.estado === EstadoProyecto.CANCELADO
    );
  }

  /**
   * Verifica si se puede transicionar a un estado específico
   */
  puedeTransicionarA(nuevoEstado: EstadoProyecto): boolean {
    return puedeTransicionar(this.props.estado, nuevoEstado);
  }

  /**
   * Calcula la duración del proyecto en días
   */
  getDuracionDias(): number {
    const fechaFin = this.props.fechaFin ?? new Date();
    const diffTime = Math.abs(fechaFin.getTime() - this.props.fechaInicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ============================================
  // Commands (modifican el estado)
  // ============================================

  /**
   * Actualiza datos básicos del proyecto
   */
  actualizar(props: ActualizarProyectoProps): void {
    if (this.estaFinalizado()) {
      throw new Error('No se puede modificar un proyecto finalizado');
    }

    if (props.nombre !== undefined) {
      if (!props.nombre.trim()) {
        throw new Error('El nombre no puede estar vacío');
      }
      this.props.nombre = props.nombre.trim();
    }

    if (props.descripcion !== undefined) {
      this.props.descripcion = props.descripcion.trim() || undefined;
    }

    if (props.ubicacion !== undefined) {
      this.props.ubicacion = props.ubicacion.trim() || undefined;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Pausa el proyecto
   */
  pausar(): void {
    this.transicionarA(EstadoProyecto.PAUSADO);
  }

  /**
   * Reactiva un proyecto pausado
   */
  reactivar(): void {
    if (this.props.estado !== EstadoProyecto.PAUSADO) {
      throw new Error('Solo se pueden reactivar proyectos pausados');
    }
    this.transicionarA(EstadoProyecto.ACTIVO);
  }

  /**
   * Completa el proyecto
   */
  completar(): void {
    this.transicionarA(EstadoProyecto.COMPLETADO);
    this.props.fechaFin = new Date();
  }

  /**
   * Cancela el proyecto
   */
  cancelar(): void {
    this.transicionarA(EstadoProyecto.CANCELADO);
    this.props.fechaFin = new Date();
  }

  /**
   * Transiciona a un nuevo estado con validación
   */
  private transicionarA(nuevoEstado: EstadoProyecto): void {
    if (!this.puedeTransicionarA(nuevoEstado)) {
      throw new Error(`No se puede transicionar de ${this.props.estado} a ${nuevoEstado}`);
    }
    this.props.estado = nuevoEstado;
    this.props.updatedAt = new Date();
  }

  // ============================================
  // Serialización
  // ============================================

  /**
   * Convierte la entidad a un objeto plano (para persistencia o UI)
   */
  toPrimitives(): ProyectoProps {
    return { ...this.props };
  }

  /**
   * Representación como string para debugging
   */
  toString(): string {
    return `Proyecto(${this.props.codigo}: ${this.props.nombre})`;
  }
}
