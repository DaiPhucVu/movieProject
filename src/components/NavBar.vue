<template>
  <nav class="navbar navbar-expand-md navbar-dark bg-dark sticky-top">
    <div class="container">

      <!-- Logo -->
      <RouterLink to="/" class="navbar-brand">
        CINE<span class="text-warning">LOG</span>
      </RouterLink>

      <!-- Toggler for mobile -->
      <button class="navbar-toggler" type="button" @click="menuOpen = !menuOpen">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Navbar links -->
      <div :class="['collapse navbar-collapse', menuOpen ? 'show' : '']">
        <ul class="navbar-nav me-auto mb-2 mb-md-0">
          <li class="nav-item">
            <RouterLink to="/" class="nav-link" exact>Home</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/search" class="nav-link">Search</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/trending" class="nav-link">Trending</RouterLink>
          </li>
          <li class="nav-item" v-if="auth.isAuthenticated">
            <RouterLink to="/watchlist" class="nav-link">Watchlist</RouterLink>
          </li>
        </ul>

        <!-- User actions -->
        <div class="d-flex align-items-center gap-2">
          <template v-if="auth.isAuthenticated">
            <RouterLink :to="`/profile/${auth.user.username}`" class="d-flex align-items-center gap-2 text-decoration-none text-light">
              <img :src="avatarUrl(auth.user, 64)" :alt="auth.user.displayName" class="rounded-circle" style="width:32px; height:32px; object-fit:cover; border:2px solid #ffc107;" />
              <span>{{ auth.user.displayName }}</span>
            </RouterLink>
            <button class="btn btn-outline-warning btn-sm" @click="handleLogout">Sign out</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="btn btn-outline-light btn-sm">Sign in</RouterLink>
            <RouterLink to="/register" class="btn btn-warning btn-sm">Join</RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { avatarUrl } from '../utils/avatar'

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
.navbar-nav .nav-link.router-link-active {
  color: #ffc107 !important; /* highlight active link */
}
.navbar-nav .nav-link:hover {
  color: #ffc107 !important;
}
</style>