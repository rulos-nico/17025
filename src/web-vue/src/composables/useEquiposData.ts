import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { EquiposAPI } from '@/api/endpoints';
import type { CreateEquipoDto, UpdateEquipoDto } from '@/types';

const KEY = ['equipos'] as const;

export function useEquipos() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => EquiposAPI.list(),
  });
}

export function useCreateEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEquipoDto) => EquiposAPI.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipoDto }) =>
      EquiposAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EquiposAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
