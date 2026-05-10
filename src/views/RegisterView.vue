<template>
    <!-- does not connect to backend yet -->
  <div class="auth-page">
    <div class="auth-card">
      <RouterLink to="/" class="auth-logo">CINE<span>LOG</span></RouterLink>
      <h1 class="auth-title">Join CineLog</h1>
      <p class="auth-sub">Create your account to review and watchlist movies</p>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input v-model="form.displayName" type="text" class="form-input" placeholder="This name will be visible to other users" required />
        </div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input v-model="form.username" type="text" class="form-input" placeholder="Username" required />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="yourmail@example.com" required />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="••••••••" required />
        </div>
        <div class="form-group">
          <label class="form-label">Confirm Password</label>
          <input v-model="form.confirmPassword" type="password" class="form-input" placeholder="••••••••" required />
        </div>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="auth-footer">
        Already have an account?
        <RouterLink to="/login" class="auth-link">Sign in</RouterLink>
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
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 40px 24px;
  background: radial-gradient(ellipse at 50% 0%, rgba(232,197,71,0.06) 0%, transparent 60%), var(--bg);
}
.auth-card {
  width: 100%; max-width: 420px;
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 40px 36px;
}
.auth-logo {
  font-family: var(--font-display); font-size: 1.4rem; letter-spacing: 0.08em;
  color: var(--text); display: block; margin-bottom: 28px;
}
.auth-logo span { color: var(--accent); }
.auth-title { font-family: var(--font-display); font-size: 2rem; letter-spacing: 0.04em; margin-bottom: 4px; }
.auth-sub { font-size: 0.88rem; color: var(--text-muted); margin-bottom: 28px; }
.auth-form { display: flex; flex-direction: column; gap: 18px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 0.88rem; font-weight: 500; color: var(--text); }
.form-input { padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); color: var(--text); font-size: 0.95rem; }
.form-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.12); }
.auth-error { font-size: 0.82rem; color: var(--red); background: rgba(232,93,93,0.1); padding: 8px 12px; border-radius: 6px; }
.auth-submit { width: 100%; justify-content: center; padding: 13px; font-size: 0.95rem; margin-top: 4px; }
.auth-footer { font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-top: 20px; }
.auth-link { color: var(--accent); font-weight: 500; }
</style>