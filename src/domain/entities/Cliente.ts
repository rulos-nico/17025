/**
 * Entidad: Cliente
 * Representa un cliente del laboratorio
 */

export interface ClienteProps {
  id: string;
  codigo: string;
  nombre: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CrearClienteProps = Omit<ClienteProps, 'id' | 'createdAt' | 'updatedAt' | 'activo'> & {
  id?: string;
};

export class Cliente {
  private constructor(private props: ClienteProps) {}

  static create(props: CrearClienteProps): Cliente {
    if (!props.codigo || props.codigo.trim() === '') {
      throw new Error('El código del cliente es requerido');
    }

    if (!props.nombre || props.nombre.trim() === '') {
      throw new Error('El nombre del cliente es requerido');
    }

    const now = new Date();

    return new Cliente({
      id: props.id ?? crypto.randomUUID(),
      codigo: props.codigo.trim().toUpperCase(),
      nombre: props.nombre.trim(),
      nit: props.nit?.trim(),
      direccion: props.direccion?.trim(),
      telefono: props.telefono?.trim(),
      email: props.email?.trim().toLowerCase(),
      contacto: props.contacto?.trim(),
      activo: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ClienteProps): Cliente {
    return new Cliente(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get codigo(): string {
    return this.props.codigo;
  }
  get nombre(): string {
    return this.props.nombre;
  }
  get nit(): string | undefined {
    return this.props.nit;
  }
  get direccion(): string | undefined {
    return this.props.direccion;
  }
  get telefono(): string | undefined {
    return this.props.telefono;
  }
  get email(): string | undefined {
    return this.props.email;
  }
  get contacto(): string | undefined {
    return this.props.contacto;
  }
  get activo(): boolean {
    return this.props.activo;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Commands
  desactivar(): void {
    if (!this.props.activo) {
      throw new Error('El cliente ya está desactivado');
    }
    this.props.activo = false;
    this.props.updatedAt = new Date();
  }

  activar(): void {
    if (this.props.activo) {
      throw new Error('El cliente ya está activo');
    }
    this.props.activo = true;
    this.props.updatedAt = new Date();
  }

  actualizar(
    props: Partial<
      Pick<ClienteProps, 'nombre' | 'nit' | 'direccion' | 'telefono' | 'email' | 'contacto'>
    >
  ): void {
    if (props.nombre !== undefined) {
      if (!props.nombre.trim()) {
        throw new Error('El nombre no puede estar vacío');
      }
      this.props.nombre = props.nombre.trim();
    }
    if (props.nit !== undefined) this.props.nit = props.nit.trim() || undefined;
    if (props.direccion !== undefined) this.props.direccion = props.direccion.trim() || undefined;
    if (props.telefono !== undefined) this.props.telefono = props.telefono.trim() || undefined;
    if (props.email !== undefined) this.props.email = props.email.trim().toLowerCase() || undefined;
    if (props.contacto !== undefined) this.props.contacto = props.contacto.trim() || undefined;

    this.props.updatedAt = new Date();
  }

  toPrimitives(): ClienteProps {
    return { ...this.props };
  }

  toString(): string {
    return `Cliente(${this.props.codigo}: ${this.props.nombre})`;
  }
}
