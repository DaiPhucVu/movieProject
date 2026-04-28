<template>
  <nav class="navbar">
    <div class="container nav-inner">
      <RouterLink to="/" class="logo">CINE<span>LOG</span></RouterLink>

      <div class="nav-links">
        <RouterLink to="/" class="nav-link">Home</RouterLink>
        <RouterLink to="/search" class="nav-link">Search</RouterLink>
        <RouterLink to="/trending" class="nav-link">Trending</RouterLink>
        <RouterLink v-if="auth.isAuthenticated" to="/watchlist" class="nav-link">Watchlist</RouterLink>
      </div>

      <div class="nav-actions">
        <template v-if="auth.isAuthenticated">
          <RouterLink :to="`/profile/${auth.user.username}`" class="avatar-link">
            <img :src="auth.user.avatar" :alt="auth.user.displayName" class="nav-avatar" />
            <span class="nav-username">{{ auth.user.displayName }}</span>
          </RouterLink>
          <button class="btn btn-ghost btn-sm" @click="handleLogout">Sign out</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-ghost btn-sm">Sign in</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm">Join</RouterLink>
        </template>
      </div>

      <!-- Mobile menu toggle -->
      <button class="hamburger" @click="menuOpen = !menuOpen" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </div>

    <!-- Mobile drawer -->
    <div v-if="menuOpen" class="mobile-menu">
      <RouterLink to="/" class="mobile-link" @click="menuOpen = false">Home</RouterLink>
      <RouterLink to="/search" class="mobile-link" @click="menuOpen = false">Search</RouterLink>
      <RouterLink to="/trending" class="mobile-link" @click="menuOpen = false">Trending</RouterLink>
      <RouterLink v-if="auth.isAuthenticated" to="/watchlist" class="mobile-link" @click="menuOpen = false">Watchlist</RouterLink>
      <template v-if="auth.isAuthenticated">
        <RouterLink :to="`/profile/${auth.user.username}`" class="mobile-link" @click="menuOpen = false">Profile</RouterLink>
        <button class="mobile-link" style="text-align:left;width:100%;color:var(--red);" @click="handleLogout">Sign out</button>
      </template>
      <template v-else>
        <RouterLink to="/login" class="mobile-link" @click="menuOpen = false">Sign in</RouterLink>
        <RouterLink to="/register" class="mobile-link" @click="menuOpen = false">Join</RouterLink>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

function handleLogout() {
  auth.logout()
  menuOpen.value = false
  router.push('/')
}
</script>

<style scoped>
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(10,10,15,0.85); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}
.nav-inner {
  display: flex; align-items: center; gap: 32px;
  height: 64px;
}
.logo {
  font-family: var(--font-display);
  font-size: 1.6rem; letter-spacing: 0.08em; color: var(--text);
  flex-shrink: 0;
}
.logo span { color: var(--accent); }
.nav-links { display: flex; gap: 4px; flex: 1; }
.nav-link {
  padding: 6px 12px; border-radius: 6px;
  font-size: 0.875rem; color: var(--text-muted);
  transition: all var(--transition);
}
.nav-link:hover, .nav-link.router-link-active { color: var(--text); background: var(--surface); }
.nav-actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.avatar-link { display: flex; align-items: center; gap: 8px; }
.nav-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent); }
.nav-username { font-size: 0.875rem; color: var(--text-muted); }
.btn-sm { padding: 7px 14px; font-size: 0.82rem; }
.hamburger { display: none; flex-direction: column; gap: 5px; padding: 6px; background: none; border: none; cursor: pointer; margin-left: auto; }
.hamburger span { display: block; width: 22px; height: 2px; background: var(--text); border-radius: 2px; }
.mobile-menu {
  display: flex; flex-direction: column;
  border-top: 1px solid var(--border);
  background: var(--bg2); padding: 12px 0;
}
.mobile-link {
  padding: 12px 24px; font-size: 0.95rem; color: var(--text-muted);
  display: block; background: none; border: none; cursor: pointer;
  font-family: var(--font-body);
  transition: color var(--transition);
}
.mobile-link:hover { color: var(--text); }
@media (max-width: 768px) {
  .nav-links, .nav-actions { display: none; }
  .hamburger { display: flex; }
}
</style>