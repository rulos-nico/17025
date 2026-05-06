<script setup lang="ts">
import { ref, computed } from 'vue';
import PageLayout from '@/components/PageLayout.vue';
import {
  useEquipos,
  useCreateEquipo,
  useUpdateEquipo,
  useDeleteEquipo,
} from '@/composables/useEquiposData';
import type { Equipo, CreateEquipoDto } from '@/types';

const { data: equipos, isLoading, isFetching, error } = useEquipos();
const createMut = useCreateEquipo();
const updateMut = useUpdateEquipo();
const deleteMut = useDeleteEquipo();

const filter = ref('');
const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase();
  if (!q) return equipos.value ?? [];
  return (equipos.value ?? []).filter(
    e => e.nombre?.toLowerCase().includes(q) || e.codigo?.toLowerCase().includes(q)
  );
});

const showModal = ref(false);
const editing = ref<Equipo | null>(null);
const form = ref<CreateEquipoDto>(blank());
const formError = ref<string | null>(null);

function blank(): CreateEquipoDto {
  return {
    nombre: '',
    marca: '',
    modelo: '',
    serie: '',
    estado: 'operativo',
    ubicacion: '',
    fecha_calibracion: null,
    proxima_calibracion: null,
  };
}

function openCreate() {
  editing.value = null;
  form.value = blank();
  formError.value = null;
  showModal.value = true;
}

function openEdit(e: Equipo) {
  editing.value = e;
  form.value = {
    nombre: e.nombre,
    marca: e.marca ?? '',
    modelo: e.modelo ?? '',
    serie: e.serie ?? '',
    estado: e.estado ?? 'operativo',
    ubicacion: e.ubicacion ?? '',
    fecha_calibracion: e.fecha_calibracion ?? null,
    proxima_calibracion: e.proxima_calibracion ?? null,
  };
  formError.value = null;
  showModal.value = true;
}

async function save() {
  formError.value = null;
  if (!form.value.nombre?.trim()) {
    formError.value = 'El nombre es requerido';
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

async function remove(e: Equipo) {
  if (!confirm(`Eliminar "${e.nombre}"?`)) return;
  await deleteMut.mutateAsync(e.id);
}

const saving = computed(() => createMut.isPending.value || updateMut.isPending.value);
</script>

<template>
  <PageLayout title="Equipos">
    <div class="toolbar">
      <input
        v-model="filter"
        placeholder="Buscar por nombre o código..."
        class="input"
        style="max-width: 320px"
      />
      <button class="btn" @click="openCreate">+ Nuevo equipo</button>
    </div>

    <div v-if="isLoading" class="card">Cargando…</div>
    <div v-else-if="error" class="card error">{{ (error as Error).message }}</div>
    <div v-else class="card" style="padding: 0; overflow: auto">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Estado</th>
            <th>Ubicación</th>
            <th>Próx. calibración</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filtered" :key="e.id">
            <td>
              <strong>{{ e.codigo }}</strong>
            </td>
            <td>{{ e.nombre }}</td>
            <td>{{ e.marca || '—' }}</td>
            <td>{{ e.modelo || '—' }}</td>
            <td>{{ e.estado || '—' }}</td>
            <td>{{ e.ubicacion || '—' }}</td>
            <td>{{ e.proxima_calibracion?.slice(0, 10) || '—' }}</td>
            <td>
              <button
                class="btn secondary"
                style="padding: 4px 8px; font-size: 12px"
                @click="openEdit(e)"
              >
                Editar
              </button>
              <button
                class="btn danger"
                style="padding: 4px 8px; font-size: 12px; margin-left: 4px"
                @click="remove(e)"
              >
                Eliminar
              </button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="8" class="muted" style="text-align: center; padding: 24px">
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
          <h2 style="margin-top: 0">{{ editing ? 'Editar equipo' : 'Nuevo equipo' }}</h2>
          <form @submit.prevent="save">
            <div class="field">
              <label>Nombre *</label>
              <input v-model="form.nombre" class="input" required />
            </div>
            <div class="row">
              <div class="field">
                <label>Marca</label><input v-model="form.marca" class="input" />
              </div>
              <div class="field">
                <label>Modelo</label><input v-model="form.modelo" class="input" />
              </div>
            </div>
            <div class="row">
              <div class="field">
                <label>Serie</label><input v-model="form.serie" class="input" />
              </div>
              <div class="field">
                <label>Estado</label>
                <select v-model="form.estado" class="select">
                  <option value="operativo">Operativo</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="fuera_servicio">Fuera de servicio</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Ubicación</label><input v-model="form.ubicacion" class="input" />
            </div>
            <div class="row">
              <div class="field">
                <label>Fecha calibración</label>
                <input v-model="form.fecha_calibracion" type="date" class="input" />
              </div>
              <div class="field">
                <label>Próxima calibración</label>
                <input v-model="form.proxima_calibracion" type="date" class="input" />
              </div>
            </div>
            <p v-if="formError" class="error">{{ formError }}</p>
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px">
              <button type="button" class="btn secondary" @click="showModal = false">
                Cancelar
              </button>
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
