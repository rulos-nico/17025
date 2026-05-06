<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const items = [
  { path: '/equipos', label: 'Equipos', icon: '🔧' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
];

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand">Lab 17025</div>
    <nav>
      <RouterLink
        v-for="item in items"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
      >
        <span>{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
    <div class="footer">
      <div class="user" v-if="auth.user">
        <div>{{ auth.user.nombre }}</div>
        <div class="muted" style="font-size: 12px">{{ auth.user.email }}</div>
      </div>
      <button class="btn secondary" @click="logout">Cerrar sesión</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px 0;
}
.brand {
  font-size: 18px;
  font-weight: 700;
  padding: 0 20px 20px;
  color: var(--color-primary);
}
nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  text-decoration: none;
  color: var(--color-text);
  border-radius: var(--radius);
  font-size: 14px;
}
.nav-item:hover {
  background: #f3f4f6;
}
.nav-item.active {
  background: var(--color-primary);
  color: white;
}
.footer {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
}
.user {
  margin-bottom: 12px;
  font-size: 14px;
}
</style>
