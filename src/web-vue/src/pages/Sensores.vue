<script setup lang="ts">
import { ref, computed } from 'vue';
import PageLayout from '@/components/PageLayout.vue';
import {
  useSensores,
  useCreateSensor,
  useUpdateSensor,
  useDeleteSensor,
} from '@/composables/useSensoresData';
import { useEquipos } from '@/composables/useEquiposData';
import type { Sensor, CreateSensorDto, Equipo } from '@/types';

const { data: sensores, isLoading, isFetching, error } = useSensores();
const { data: equipos } = useEquipos();
const createMut = useCreateSensor();
const updateMut = useUpdateSensor();
const deleteMut = useDeleteSensor();

const filter = ref('');
const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase();
  const list = sensores.value ?? [];
  if (!q) return list;
  return list.filter(
    (s: Sensor) =>
      s.codigo?.toLowerCase().includes(q) ||
      s.tipo?.toLowerCase().includes(q) ||
      s.numero_serie?.toLowerCase().includes(q),
  );
});

const equiposById = computed(() => {
  const map = new Map<string, Equipo>();
  for (const e of equipos.value ?? []) map.set(e.id, e);
  return map;
});

const showModal = ref(false);
const editing = ref<Sensor | null>(null);
const form = ref<CreateSensorDto>(blank());
const formError = ref<string | null>(null);

function blank(): CreateSensorDto {
  return {
    tipo: 'general',
    marca: '',
    modelo: '',
    numero_serie: '',
    ubicacion: '',
    equipo_id: null,
  };
}

function openCreate() {
  editing.value = null;
  form.value = blank();
  formError.value = null;
  showModal.value = true;
}

function openEdit(s: Sensor) {
  editing.value = s;
  form.value = {
    tipo: s.tipo,
    marca: s.marca ?? '',
    modelo: s.modelo ?? '',
    numero_serie: s.numero_serie,
    ubicacion: s.ubicacion ?? '',
    equipo_id: s.equipo_id ?? null,
  };
  formError.value = null;
  showModal.value = true;
}

async function save() {
  formError.value = null;
  if (!form.value.tipo?.trim()) {
    formError.value = 'El tipo es requerido';
    return;
  }
  try {
    if (editing.value) {
      await updateMut.mutateAsync({ id: editing.value.id, data: form.value });
    } else {
      await createMut.mutateAsync(form.value);
    }
    showModal.value = false;
  } catch (e: any) {
    formError.value = e?.response?.data?.title || 'Error al guardar';
  }
}

async function remove(s: Sensor) {
  if (!confirm(`Eliminar sensor "${s.codigo}"?`)) return;
  await deleteMut.mutateAsync(s.id);
}

const saving = computed(() => createMut.isPending.value || updateMut.isPending.value);
</script>

<template>
  <PageLayout title="Sensores">
    <div class="toolbar">
      <input
        v-model="filter"
        placeholder="Buscar por código, tipo o número de serie..."
        class="input"
        style="max-width: 320px"
      />
      <button class="btn" @click="openCreate">+ Nuevo sensor</button>
    </div>

    <div v-if="isLoading" class="card">Cargando…</div>
    <div v-else-if="error" class="card error">{{ (error as Error).message }}</div>
    <div v-else class="card" style="padding: 0; overflow: auto">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Tipo</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>N° Serie</th>
            <th>Ubicación</th>
            <th>Equipo</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id">
            <td><strong>{{ s.codigo }}</strong></td>
            <td>{{ s.tipo }}</td>
            <td>{{ s.marca || '—' }}</td>
            <td>{{ s.modelo || '—' }}</td>
            <td>{{ s.numero_serie || '—' }}</td>
            <td>{{ s.ubicacion || '—' }}</td>
            <td>{{ s.equipo_id ? (equiposById.get(s.equipo_id)?.codigo ?? s.equipo_id.slice(0, 8)) : '—' }}</td>
            <td>{{ s.estado }}</td>
            <td>
              <button
                class="btn secondary"
                style="padding: 4px 8px; font-size: 12px"
                @click="openEdit(s)"
              >Editar</button>
              <button
                class="btn danger"
                style="padding: 4px 8px; font-size: 12px; margin-left: 4px"
                @click="remove(s)"
              >Eliminar</button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="9" class="muted" style="text-align: center; padding: 24px">
              Sin resultados
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="isFetching && !isLoading" class="muted" style="margin-top: 8px; font-size: 12px">
      Actualizando…
    </p>

    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal">
          <h2 style="margin-top: 0">{{ editing ? 'Editar sensor' : 'Nuevo sensor' }}</h2>
          <form @submit.prevent="save">
            <div class="row">
              <div class="field">
                <label>Tipo *</label>
                <input v-model="form.tipo" class="input" required />
              </div>
              <div class="field">
                <label>N° Serie *</label>
                <input v-model="form.numero_serie" class="input" required />
              </div>
            </div>
            <div class="row">
              <div class="field">
                <label>Marca</label><input v-model="form.marca" class="input" />
              </div>
              <div class="field">
                <label>Modelo</label><input v-model="form.modelo" class="input" />
              </div>
            </div>
            <div class="field">
              <label>Ubicación</label><input v-model="form.ubicacion" class="input" />
            </div>
            <div class="field">
              <label>Equipo asociado</label>
              <select v-model="form.equipo_id" class="select">
                <option :value="null">— Ninguno —</option>
                <option v-for="e in equipos ?? []" :key="e.id" :value="e.id">
                  {{ e.codigo }} · {{ e.nombre }}
                </option>
              </select>
            </div>
            <p v-if="formError" class="error">{{ formError }}</p>
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px">
              <button type="button" class="btn secondary" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn" :disabled="saving">
                {{ saving ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </PageLayout>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}
</style>
