/**
 * ApiProyectoRepository - Implementación del repositorio de proyectos
 *
 * Implementa la interfaz ProyectoRepository usando el ApiClient
 */

import { Proyecto } from '@domain/entities';
import {
  ProyectoRepository,
  ProyectoBusquedaCriteria,
  PaginacionOptions,
  PaginatedResult,
} from '@domain/repositories';
import { EstadoProyecto } from '@domain/value-objects';
import { ApiClient } from '../api/ApiClient';
import { ProyectoApiMapper, ProyectoApiResponse } from '../mappers/ProyectoApiMapper';

/**
 * Endpoints del API para proyectos
 */
const ENDPOINTS = {
  list: '/api/proyectos',
  detail: (id: string) => `/api/proyectos/${id}`,
  byCliente: (clienteId: string) => `/api/proyectos?cliente_id=${clienteId}`,
  byCodigo: (codigo: string) => `/api/proyectos?codigo=${codigo}`,
} as const;

/**
 * Implementación del repositorio usando el API REST
 */
export class ApiProyectoRepository implements ProyectoRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async findAll(): Promise<Proyecto[]> {
    const response = await this.apiClient.get<ProyectoApiResponse[]>(ENDPOINTS.list);
    return ProyectoApiMapper.toDomainList(response);
  }

  async findPaginated(options: PaginacionOptions): Promise<PaginatedResult<Proyecto>> {
    const params = new URLSearchParams({
      page: String(options.page),
      limit: String(options.limit),
      ...(options.orderBy && { order_by: options.orderBy }),
      ...(options.orderDir && { order_dir: options.orderDir }),
    });

    const response = await this.apiClient.get<{
      data: ProyectoApiResponse[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    }>(`${ENDPOINTS.list}?${params}`);

    return {
      data: ProyectoApiMapper.toDomainList(response.data),
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.total_pages,
    };
  }

  async findByCriteria(criteria: ProyectoBusquedaCriteria): Promise<Proyecto[]> {
    const params = new URLSearchParams();

    if (criteria.clienteId) params.append('cliente_id', criteria.clienteId);
    if (criteria.estado) params.append('estado', criteria.estado);
    if (criteria.fechaDesde) params.append('fecha_desde', criteria.fechaDesde.toISOString());
    if (criteria.fechaHasta) params.append('fecha_hasta', criteria.fechaHasta.toISOString());
    if (criteria.busqueda) params.append('q', criteria.busqueda);

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.list}?${queryString}` : ENDPOINTS.list;

    const response = await this.apiClient.get<ProyectoApiResponse[]>(url);
    return ProyectoApiMapper.toDomainList(response);
  }

  async findById(id: string): Promise<Proyecto | null> {
    try {
      const response = await this.apiClient.get<ProyectoApiResponse>(ENDPOINTS.detail(id));
      return ProyectoApiMapper.toDomain(response);
    } catch (error) {
      if (
        error instanceof Error &&
        'status' in error &&
        (error as { status: number }).status === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  async findByCodigo(codigo: string): Promise<Proyecto | null> {
    try {
      const response = await this.apiClient.get<ProyectoApiResponse[]>(ENDPOINTS.byCodigo(codigo));
      if (response.length === 0) return null;
      return ProyectoApiMapper.toDomain(response[0]);
    } catch (error) {
      if (
        error instanceof Error &&
        'status' in error &&
        (error as { status: number }).status === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  async findByClienteId(clienteId: string): Promise<Proyecto[]> {
    const response = await this.apiClient.get<ProyectoApiResponse[]>(
      ENDPOINTS.byCliente(clienteId)
    );
    return ProyectoApiMapper.toDomainList(response);
  }

  async existsByCodigo(codigo: string): Promise<boolean> {
    const proyecto = await this.findByCodigo(codigo);
    return proyecto !== null;
  }

  async save(proyecto: Proyecto): Promise<Proyecto> {
    const request = ProyectoApiMapper.toApi(proyecto);
    const response = await this.apiClient.post<ProyectoApiResponse>(ENDPOINTS.list, request);
    return ProyectoApiMapper.toDomain(response);
  }

  async update(proyecto: Proyecto): Promise<Proyecto> {
    const request = ProyectoApiMapper.toApi(proyecto);
    const response = await this.apiClient.put<ProyectoApiResponse>(
      ENDPOINTS.detail(proyecto.id),
      request
    );
    return ProyectoApiMapper.toDomain(response);
  }

  async delete(id: string): Promise<void> {
    await this.apiClient.delete(ENDPOINTS.detail(id));
  }

  async count(): Promise<number> {
    const response = await this.apiClient.get<{ count: number }>(`${ENDPOINTS.list}/count`);
    return response.count;
  }

  async countByEstado(estado: EstadoProyecto): Promise<number> {
    const response = await this.apiClient.get<{ count: number }>(
      `${ENDPOINTS.list}/count?estado=${estado}`
    );
    return response.count;
  }
}
