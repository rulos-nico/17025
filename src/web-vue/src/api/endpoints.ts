import { apiClient } from './client';
import type { Equipo, CreateEquipoDto, UpdateEquipoDto, LoginResponse, UserInfo } from '@/types';

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
