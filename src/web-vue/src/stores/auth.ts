import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthAPI } from '@/api/endpoints';
import { tokenStorage } from '@/api/client';
import type { UserInfo } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null);
  const token = ref<string | null>(tokenStorage.get());
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await AuthAPI.login(email, password);
      token.value = res.access_token;
      user.value = res.user;
      tokenStorage.set(res.access_token);
    } catch (e: any) {
      error.value = e?.response?.data?.title || 'Error al iniciar sesión';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMe() {
    if (!token.value) return;
    try {
      user.value = await AuthAPI.me();
    } catch {
      logout();
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    tokenStorage.clear();
  }

  return { user, token, loading, error, isAuthenticated, login, logout, fetchMe };
});
