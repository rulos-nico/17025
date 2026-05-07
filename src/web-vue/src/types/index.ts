export interface Equipo {
  id: string;
  codigo: string;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  serie?: string | null;
  estado?: string | null;
  ubicacion?: string | null;
  fecha_calibracion?: string | null;
  proxima_calibracion?: string | null;
  activo: boolean;
  sensores_asociados?: unknown[];
}

export interface CreateEquipoDto {
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  serie?: string | null;
  estado?: string | null;
  ubicacion?: string | null;
  fecha_calibracion?: string | null;
  proxima_calibracion?: string | null;
}

export type UpdateEquipoDto = Partial<CreateEquipoDto> & { activo?: boolean };

// ---------------------------------------------------------------------------
// Cliente (Fase A.3)
// ---------------------------------------------------------------------------
export interface Cliente {
  id: string;
  codigo: string;
  nombre: string;
  rut?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  email?: string | null;
  contacto_nombre?: string | null;
  contacto_cargo?: string | null;
  contacto_email?: string | null;
  contacto_telefono?: string | null;
  activo: boolean;
  drive_folder_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClienteDto {
  nombre: string;
  rut?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  email?: string | null;
  contacto_nombre?: string | null;
  contacto_cargo?: string | null;
  contacto_email?: string | null;
  contacto_telefono?: string | null;
}

export type UpdateClienteDto = Partial<CreateClienteDto> & { activo?: boolean };

// ---------------------------------------------------------------------------
// Sensor (Fase A.3)
// ---------------------------------------------------------------------------
export interface Sensor {
  id: string;
  codigo: string;
  tipo: string;
  marca?: string | null;
  modelo?: string | null;
  numero_serie: string;
  rango_medicion?: string | null;
  precision?: string | null;
  ubicacion?: string | null;
  estado: string;
  fecha_calibracion?: string | null;
  proxima_calibracion?: string | null;
  error_maximo?: string | null;
  certificado_id?: string | null;
  responsable?: string | null;
  observaciones?: string | null;
  activo: boolean;
  equipo_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSensorDto {
  tipo: string;
  marca?: string | null;
  modelo?: string | null;
  numero_serie: string;
  ubicacion?: string | null;
  equipo_id?: string | null;
}

export type UpdateSensorDto = Partial<{
  tipo: string;
  marca: string | null;
  modelo: string | null;
  ubicacion: string | null;
  estado: string;
  responsable: string | null;
  observaciones: string | null;
  activo: boolean;
  equipo_id: string | null;
}>;

export interface UserInfo {
  id: string;
  email: string;
  nombre: string;
  apellido?: string | null;
  rol: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
}
