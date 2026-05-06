<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue';
import { useEquipos } from '@/composables/useEquiposData';
import { computed } from 'vue';

const { data: equipos } = useEquipos();
const total = computed(() => equipos.value?.length ?? 0);
const operativos = computed(
  () => (equipos.value ?? []).filter(e => e.estado === 'operativo').length
);
</script>

<template>
  <PageLayout title="Dashboard">
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px"
    >
      <div class="card">
        <div class="muted">Total equipos</div>
        <div style="font-size: 32px; font-weight: 600">{{ total }}</div>
      </div>
      <div class="card">
        <div class="muted">Operativos</div>
        <div style="font-size: 32px; font-weight: 600; color: var(--color-success)">
          {{ operativos }}
        </div>
      </div>
    </div>
  </PageLayout>
</template>
