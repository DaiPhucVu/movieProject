<template>
  <div class="auth-page d-flex align-items-center justify-content-center min-vh-100 py-5">
    <div class="card p-4 p-md-5" style="max-width: 420px; width:100%;">
      <!-- Logo -->
      <RouterLink to="/" class="d-block text-center mb-4 fs-3 fw-bold text-light text-decoration-none">
        CINE<span class="text-warning">LOG</span>
      </RouterLink>

      <!-- Title & Subtitle -->
      <h1 class="h4 text-center mb-1 text-light">Welcome back</h1>
      <p class="text-light text-center mb-4">
        Sign in to your account
      </p>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="row g-3">
        <!-- Username / Email -->
        <div class="col-12">
          <label class="form-label text-light">Username or Email</label>
          <input
            v-model="form.username"
            type="text"
            class="form-control bg-dark text-light border-secondary"
            placeholder="cinephile_kai"
            required
          />
        </div>

        <!-- Password -->
        <div class="col-12">
          <label class="form-label text-light">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="form-control bg-dark text-light border-secondary"
            placeholder="••••••••"
            required
          />
        </div>

        <!-- Error -->
        <div v-if="error" class="col-12">
          <p class="text-danger small bg-danger bg-opacity-10 p-2 rounded">
            {{ error }}
          </p>
        </div>

        <!-- Submit -->
        <div class="col-12">
          <button type="submit" class="btn btn-warning w-100" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>
      </form>

      <!-- Footer -->
      <p class="text-center text-light small mt-3">
        Don't have an account?
        <RouterLink to="/register" class="text-warning fw-medium text-decoration-none">Create one</RouterLink>
      </p>

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
      rgba(232, 197, 71, 0.05) 0%,
      transparent 60%
    ),
    var(--bg);
}

.card {
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  background-color: var(--bg2);
}

.text-warning {
  color: var(--accent) !important;
}
</style>