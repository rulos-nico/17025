import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { SensoresAPI } from '@/api/endpoints';
import type { CreateSensorDto, UpdateSensorDto } from '@/types';

const KEY_ALL = ['sensores'] as const;
const KEY_BY_EQUIPO = (equipoId: string) => ['sensores', 'equipo', equipoId] as const;

export function useSensores() {
  return useQuery({ queryKey: KEY_ALL, queryFn: () => SensoresAPI.list() });
}

export function useSensoresByEquipo(equipoId: string) {
  return useQuery({
    queryKey: KEY_BY_EQUIPO(equipoId),
    queryFn: () => SensoresAPI.byEquipo(equipoId),
    enabled: !!equipoId,
  });
}

export function useCreateSensor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSensorDto) => SensoresAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensores'] });
    },
  });
}

export function useUpdateSensor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSensorDto }) =>
      SensoresAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sensores'] }),
  });
}

export function useDeleteSensor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SensoresAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sensores'] }),
  });
}
