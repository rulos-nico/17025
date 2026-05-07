<script setup lang="ts">
import { ref, computed } from 'vue';
import PageLayout from '@/components/PageLayout.vue';
import {
  useClientes,
  useCreateCliente,
  useUpdateCliente,
  useDeleteCliente,
} from '@/composables/useClientesData';
import type { Cliente, CreateClienteDto } from '@/types';

const { data: clientes, isLoading, isFetching, error } = useClientes();
const createMut = useCreateCliente();
const updateMut = useUpdateCliente();
const deleteMut = useDeleteCliente();

const filter = ref('');
const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase();
  if (!q) return clientes.value ?? [];
  return (clientes.value ?? []).filter(
    (c: Cliente) =>
      c.nombre?.toLowerCase().includes(q) ||
      c.codigo?.toLowerCase().includes(q) ||
      c.rut?.toLowerCase().includes(q),
  );
});

const showModal = ref(false);
const editing = ref<Cliente | null>(null);
const form = ref<CreateClienteDto>(blank());
const formError = ref<string | null>(null);

function blank(): CreateClienteDto {
  return {
    nombre: '',
    rut: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: '',
    contacto_nombre: '',
    contacto_cargo: '',
    contacto_email: '',
    contacto_telefono: '',
  };
}

function openCreate() {
  editing.value = null;
  form.value = blank();
  formError.value = null;
  showModal.value = true;
}

function openEdit(c: Cliente) {
  editing.value = c;
  form.value = {
    nombre: c.nombre,
    rut: c.rut ?? '',
    direccion: c.direccion ?? '',
    ciudad: c.ciudad ?? '',
    telefono: c.telefono ?? '',
    email: c.email ?? '',
    contacto_nombre: c.contacto_nombre ?? '',
    contacto_cargo: c.contacto_cargo ?? '',
    contacto_email: c.contacto_email ?? '',
    contacto_telefono: c.contacto_telefono ?? '',
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

async function remove(c: Cliente) {
  if (!confirm(`Eliminar "${c.nombre}"?`)) return;
  await deleteMut.mutateAsync(c.id);
}

const saving = computed(() => createMut.isPending.value || updateMut.isPending.value);
</script>

<template>
  <PageLayout title="Clientes">
    <div class="toolbar">
      <input
        v-model="filter"
        placeholder="Buscar por nombre, código o RUT..."
        class="input"
        style="max-width: 320px"
      />
      <button class="btn" @click="openCreate">+ Nuevo cliente</button>
    </div>

    <div v-if="isLoading" class="card">Cargando…</div>
    <div v-else-if="error" class="card error">{{ (error as Error).message }}</div>
    <div v-else class="card" style="padding: 0; overflow: auto">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>RUT</th>
            <th>Ciudad</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Contacto</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filtered" :key="c.id">
            <td><strong>{{ c.codigo }}</strong></td>
            <td>{{ c.nombre }}</td>
            <td>{{ c.rut || '—' }}</td>
            <td>{{ c.ciudad || '—' }}</td>
            <td>{{ c.email || '—' }}</td>
            <td>{{ c.telefono || '—' }}</td>
            <td>{{ c.contacto_nombre || '—' }}</td>
            <td>
              <button
                class="btn secondary"
                style="padding: 4px 8px; font-size: 12px"
                @click="openEdit(c)"
              >Editar</button>
              <button
                class="btn danger"
                style="padding: 4px 8px; font-size: 12px; margin-left: 4px"
                @click="remove(c)"
              >Eliminar</button>
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
          <h2 style="margin-top: 0">{{ editing ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
          <form @submit.prevent="save">
            <div class="field">
              <label>Nombre *</label>
              <input v-model="form.nombre" class="input" required />
            </div>
            <div class="row">
              <div class="field">
                <label>RUT</label><input v-model="form.rut" class="input" />
              </div>
              <div class="field">
                <label>Ciudad</label><input v-model="form.ciudad" class="input" />
              </div>
            </div>
            <div class="field">
              <label>Dirección</label><input v-model="form.direccion" class="input" />
            </div>
            <div class="row">
              <div class="field">
                <label>Email</label><input v-model="form.email" type="email" class="input" />
              </div>
              <div class="field">
                <label>Teléfono</label><input v-model="form.telefono" class="input" />
              </div>
            </div>
            <h3 style="margin: 16px 0 8px; font-size: 14px">Contacto</h3>
            <div class="row">
              <div class="field">
                <label>Nombre contacto</label><input v-model="form.contacto_nombre" class="input" />
              </div>
              <div class="field">
                <label>Cargo</label><input v-model="form.contacto_cargo" class="input" />
              </div>
            </div>
            <div class="row">
              <div class="field">
                <label>Email contacto</label>
                <input v-model="form.contacto_email" type="email" class="input" />
              </div>
              <div class="field">
                <label>Teléfono contacto</label>
                <input v-model="form.contacto_telefono" class="input" />
              </div>
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
