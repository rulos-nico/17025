/**
 * Entidad: Perforacion
 * Representa un punto de muestreo dentro de un proyecto
 */

export interface PerforacionProps {
  id: string;
  codigo: string;
  proyectoId: string;
  nombre: string;
  profundidadInicial: number;
  profundidadFinal: number;
  coordenadaX?: number;
  coordenadaY?: number;
  coordenadaZ?: number;
  metodoPerforacion?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CrearPerforacionProps = Omit<PerforacionProps, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export class Perforacion {
  private constructor(private props: PerforacionProps) {}

  static create(props: CrearPerforacionProps): Perforacion {
    if (!props.codigo || props.codigo.trim() === '') {
      throw new Error('El código de la perforación es requerido');
    }

    if (!props.proyectoId) {
      throw new Error('El proyecto es requerido');
    }

    if (!props.nombre || props.nombre.trim() === '') {
      throw new Error('El nombre de la perforación es requerido');
    }

    if (props.profundidadInicial < 0) {
      throw new Error('La profundidad inicial no puede ser negativa');
    }

    if (props.profundidadFinal < props.profundidadInicial) {
      throw new Error('La profundidad final debe ser mayor o igual a la inicial');
    }

    const now = new Date();

    return new Perforacion({
      id: props.id ?? crypto.randomUUID(),
      codigo: props.codigo.trim().toUpperCase(),
      proyectoId: props.proyectoId,
      nombre: props.nombre.trim(),
      profundidadInicial: props.profundidadInicial,
      profundidadFinal: props.profundidadFinal,
      coordenadaX: props.coordenadaX,
      coordenadaY: props.coordenadaY,
      coordenadaZ: props.coordenadaZ,
      metodoPerforacion: props.metodoPerforacion?.trim(),
      fechaInicio: props.fechaInicio,
      fechaFin: props.fechaFin,
      observaciones: props.observaciones?.trim(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: PerforacionProps): Perforacion {
    return new Perforacion(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get codigo(): string {
    return this.props.codigo;
  }
  get proyectoId(): string {
    return this.props.proyectoId;
  }
  get nombre(): string {
    return this.props.nombre;
  }
  get profundidadInicial(): number {
    return this.props.profundidadInicial;
  }
  get profundidadFinal(): number {
    return this.props.profundidadFinal;
  }
  get coordenadaX(): number | undefined {
    return this.props.coordenadaX;
  }
  get coordenadaY(): number | undefined {
    return this.props.coordenadaY;
  }
  get coordenadaZ(): number | undefined {
    return this.props.coordenadaZ;
  }
  get metodoPerforacion(): string | undefined {
    return this.props.metodoPerforacion;
  }
  get fechaInicio(): Date | undefined {
    return this.props.fechaInicio;
  }
  get fechaFin(): Date | undefined {
    return this.props.fechaFin;
  }
  get observaciones(): string | undefined {
    return this.props.observaciones;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Queries
  getProfundidadTotal(): number {
    return this.props.profundidadFinal - this.props.profundidadInicial;
  }

  tieneCoordenadas(): boolean {
    return this.props.coordenadaX !== undefined && this.props.coordenadaY !== undefined;
  }

  // Commands
  actualizar(
    props: Partial<
      Pick<PerforacionProps, 'nombre' | 'profundidadFinal' | 'observaciones' | 'metodoPerforacion'>
    >
  ): void {
    if (props.nombre !== undefined) {
      if (!props.nombre.trim()) {
        throw new Error('El nombre no puede estar vacío');
      }
      this.props.nombre = props.nombre.trim();
    }

    if (props.profundidadFinal !== undefined) {
      if (props.profundidadFinal < this.props.profundidadInicial) {
        throw new Error('La profundidad final debe ser mayor o igual a la inicial');
      }
      this.props.profundidadFinal = props.profundidadFinal;
    }

    if (props.observaciones !== undefined) {
      this.props.observaciones = props.observaciones.trim() || undefined;
    }

    if (props.metodoPerforacion !== undefined) {
      this.props.metodoPerforacion = props.metodoPerforacion.trim() || undefined;
    }

    this.props.updatedAt = new Date();
  }

  setCoordenadas(x: number, y: number, z?: number): void {
    this.props.coordenadaX = x;
    this.props.coordenadaY = y;
    this.props.coordenadaZ = z;
    this.props.updatedAt = new Date();
  }

  toPrimitives(): PerforacionProps {
    return { ...this.props };
  }

  toString(): string {
    return `Perforacion(${this.props.codigo}: ${this.props.nombre})`;
  }
}
