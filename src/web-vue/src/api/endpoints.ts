import { apiClient } from './client';
import type {
  Equipo, CreateEquipoDto, UpdateEquipoDto,
  Cliente, CreateClienteDto, UpdateClienteDto,
  Sensor, CreateSensorDto, UpdateSensorDto,
  LoginResponse, UserInfo,
} from '@/types';

export const AuthAPI = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }).then(r => r.data),
  me: () => apiClient.get<UserInfo>('/auth/me').then(r => r.data),
};

export const EquiposAPI = {
  list: () => apiClient.get<Equipo[]>('/equipos').then(r => r.data),
  get: (id: string) => apiClient.get<Equipo>(`/equipos/${id}`).then(r => r.data),
  create: (data: CreateEquipoDto) => apiClient.post<Equipo>('/equipos', data).then(r => r.data),
  update: (id: string, data: UpdateEquipoDto) =>
    apiClient.put<Equipo>(`/equipos/${id}`, data).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/equipos/${id}`).then(r => r.data),
};

export const ClientesAPI = {
  list: () => apiClient.get<Cliente[]>('/clientes').then(r => r.data),
  get: (id: string) => apiClient.get<Cliente>(`/clientes/${id}`).then(r => r.data),
  proyectos: (id: string) =>
    apiClient.get<unknown[]>(`/clientes/${id}/proyectos`).then(r => r.data),
  create: (data: CreateClienteDto) =>
    apiClient.post<Cliente>('/clientes', data).then(r => r.data),
  update: (id: string, data: UpdateClienteDto) =>
    apiClient.put<Cliente>(`/clientes/${id}`, data).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/clientes/${id}`).then(r => r.data),
};

export const SensoresAPI = {
  list: () => apiClient.get<Sensor[]>('/sensores').then(r => r.data),
  byEquipo: (equipoId: string) =>
    apiClient.get<Sensor[]>(`/sensores/equipo/${equipoId}`).then(r => r.data),
  get: (id: string) => apiClient.get<Sensor>(`/sensores/${id}`).then(r => r.data),
  create: (data: CreateSensorDto) =>
    apiClient.post<Sensor>('/sensores', data).then(r => r.data),
  update: (id: string, data: UpdateSensorDto) =>
    apiClient.put<Sensor>(`/sensores/${id}`, data).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/sensores/${id}`).then(r => r.data),
};
