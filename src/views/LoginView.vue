<template>
  <div class="auth-page d-flex align-items-center justify-content-center min-vh-100 py-5 bg-light">
    <div class="card p-4 p-md-5" style="max-width: 420px; width:100%;">
      <!-- Logo -->
      <RouterLink to="/" class="d-block text-center mb-4 fs-3 fw-bold text-dark text-decoration-none">
        CINE<span class="text-warning">LOG</span>
      </RouterLink>

      <!-- Title & Subtitle -->
      <h1 class="h4 text-center mb-1">Welcome back</h1>
      <p class="text-muted text-center mb-4">Sign in to your account</p>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="d-flex flex-column gap-3">
        <div class="mb-3">
          <label class="form-label">Username or Email</label>
          <input
            v-model="form.username"
            type="text"
            class="form-control"
            placeholder="cinephile_kai"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="form-control"
            placeholder="••••••••"
            required
          />
        </div>

        <!-- Error message -->
        <p v-if="error" class="text-danger small bg-danger bg-opacity-10 p-2 rounded">
          {{ error }}
        </p>

        <button type="submit" class="btn btn-primary w-100" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <!-- Footer -->
      <p class="text-center text-muted small mt-3">
        Don't have an account?
        <RouterLink to="/register" class="text-warning fw-medium text-decoration-none">Create one</RouterLink>
      </p>

      <!-- Demo accounts -->
      <div class="mt-4 pt-3 border-top">
        <p class="text-uppercase small text-muted mb-2">Demo accounts</p>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="u in demoUsers"
            :key="u.username"
            class="btn btn-outline-secondary btn-sm"
            @click="fillDemo(u)"
          >
            {{ u.username }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

const demoUsers = [
  { username: 'cinephile_kai', password: 'demo' },
  { username: 'reeltalks', password: 'demo' },
  { username: 'framebyframe', password: 'demo' },
]

function fillDemo(u) {
  form.value.username = u.username
  form.value.password = u.password
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  const result = await auth.login(form.value.username, form.value.password)
  loading.value = false
  if (result.success) {
    router.push(route.query.redirect || '/')
  } else {
    error.value = result.error
  }
}
</script>

<style scoped>
.auth-page {
  background: radial-gradient(
      ellipse at 50% 0%,
      rgba(232, 197, 71, 0.06) 0%,
      transparent 60%
    ),
    #f8f9fa;
}

.card {
  border-radius: 0.75rem;
  border: 1px solid #dee2e6;
  background-color: #fff;
}

.text-warning {
  color: #e8c547 !important;
}
</style>