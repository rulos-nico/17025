/**
 * Configuración de API compartida
 * Centraliza la configuración de conexión al backend
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Validación en producción
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  throw new Error('Falta VITE_API_URL en producción');
}

export const API_CONFIG = {
  baseURL: BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 10000),
} as const;

export type ApiConfig = typeof API_CONFIG;
