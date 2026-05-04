<template>
  <div class="auth-page">
    <div class="auth-card">
      <RouterLink to="/" class="auth-logo">CINE<span>LOG</span></RouterLink>
      <h1 class="auth-title">Welcome back</h1>
      <p class="auth-sub">Sign in to your account</p>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Username or Email</label>
          <input v-model="form.username" type="text" class="form-input" placeholder="cinephile_kai" required />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="••••••••" required />
        </div>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="auth-footer">
        Don't have an account?
        <RouterLink to="/register" class="auth-link">Create one</RouterLink>
      </p>

      <div class="demo-hint">
        <p class="demo-title">Demo accounts</p>
        <button v-for="u in demoUsers" :key="u.username" class="demo-user" @click="fillDemo(u)">
          {{ u.username }}
        </button>
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
    // auth.login() now calls the real backend — must be awaited
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
    .auth-error { font-size: 0.82rem; color: var(--red); background: rgba(232,93,93,0.1); padding: 8px 12px; border-radius: 6px; }
    .auth-submit { width: 100%; justify-content: center; padding: 13px; font-size: 0.95rem; margin-top: 4px; }
    .auth-footer { font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-top: 20px; }
    .auth-link { color: var(--accent); font-weight: 500; }
    .demo-hint { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
    .demo-title { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-dim); margin-bottom: 10px; }
    .demo-user {
    display: inline-flex; margin: 4px 4px 0 0;
    padding: 4px 12px; border-radius: 100px;
    font-size: 0.78rem; font-family: var(--font-body);
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text-muted); cursor: pointer;
    transition: all var(--transition);
    }
    .demo-user:hover { border-color: var(--accent); color: var(--accent); }
</style>
