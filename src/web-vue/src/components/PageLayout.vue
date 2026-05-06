<script setup lang="ts">
import Sidebar from './Sidebar.vue';

defineProps<{ title?: string }>();
</script>

<template>
  <div class="layout">
    <Sidebar />
    <main class="content">
      <header v-if="title" class="page-header">
        <h1>{{ title }}</h1>
      </header>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.content {
  flex: 1;
  padding: 24px 32px;
  overflow: auto;
}
.page-header {
  margin-bottom: 24px;
}
.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}
</style>
