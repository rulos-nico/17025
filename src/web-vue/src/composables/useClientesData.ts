import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { ClientesAPI } from '@/api/endpoints';
import type { CreateClienteDto, UpdateClienteDto } from '@/types';

const KEY = ['clientes'] as const;

export function useClientes() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => ClientesAPI.list(),
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClienteDto) => ClientesAPI.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClienteDto }) =>
      ClientesAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ClientesAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
