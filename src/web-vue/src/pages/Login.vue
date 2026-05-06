<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const email = ref('demo@ingetec.cl');
const password = ref('demo1234');
const router = useRouter();
const auth = useAuthStore();

async function submit() {
  try {
    await auth.login(email.value, password.value);
    router.push('/equipos');
  } catch {
    /* error mostrado vía store */
  }
}
</script>

<template>
  <div class="login-page">
    <form class="card login-form" @submit.prevent="submit">
      <h1>Lab 17025</h1>
      <p class="muted">Inicia sesión para continuar</p>
      <div class="field">
        <label>Email</label>
        <input v-model="email" type="email" class="input" required />
      </div>
      <div class="field">
        <label>Password</label>
        <input v-model="password" type="password" class="input" required />
      </div>
      <p v-if="auth.error" class="error">{{ auth.error }}</p>
      <button type="submit" class="btn" :disabled="auth.loading">
        {{ auth.loading ? 'Ingresando…' : 'Ingresar' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.login-form {
  width: 100%;
  max-width: 380px;
  padding: 32px;
}
.login-form h1 {
  margin: 0 0 4px;
  color: var(--color-primary);
}
.login-form .btn {
  width: 100%;
  margin-top: 8px;
}
</style>
