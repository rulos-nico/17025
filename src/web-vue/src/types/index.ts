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
