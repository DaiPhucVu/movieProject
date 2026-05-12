<template>
  <div class="auth-page d-flex align-items-center justify-content-center min-vh-100 py-5">
    <div class="card p-4 p-md-5" style="max-width: 420px; width:100%;">
      <!-- Logo -->
      <RouterLink to="/" class="d-block text-center mb-4 fs-3 fw-bold text-light text-decoration-none">
        CINE<span class="text-warning">LOG</span>
      </RouterLink>

      <!-- Title & Subtitle -->
      <h1 class="h4 text-center mb-1 text-light">Join CineLog</h1>
      <p class="text-light text-center mb-4">
        Create your account to review and watchlist movies
      </p>

      <!-- Form -->
      <form @submit.prevent="handleRegister" class="row g-3">
        <!-- Display Name -->
        <div class="col-12">
          <label class="form-label text-light">Display Name</label>
          <input
            v-model="form.displayName"
            type="text"
            class="form-control bg-dark text-light border-secondary"
            placeholder="This name will be visible to other users"
            required
          />
        </div>

        <!-- Username -->
        <div class="col-12">
          <label class="form-label text-light">Username</label>
          <input
            v-model="form.username"
            type="text"
            class="form-control bg-dark text-light border-secondary"
            placeholder="Username"
            required
          />
        </div>

        <!-- Email -->
        <div class="col-12">
          <label class="form-label text-light">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="form-control bg-dark text-light border-secondary"
            placeholder="yourmail@example.com"
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

        <!-- Confirm Password -->
        <div class="col-12">
          <label class="form-label text-light">Confirm Password</label>
          <input
            v-model="form.confirmPassword"
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
            {{ loading ? 'Creating account...' : 'Create account' }}
          </button>
        </div>
      </form>

      <!-- Footer -->
      <p class="text-center text-light small mt-3">
        Already have an account?
        <RouterLink to="/login" class="text-warning fw-medium text-decoration-none">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = ref({
  displayName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  error.value = ''
  loading.value = true

  const result = await auth.register(form.value)
  loading.value = false

  if (result.success) {
    router.push('/')
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
    var(--bg); /* should be dark from global CSS */
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