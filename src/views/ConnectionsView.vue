<template>
  <div class="connections-page py-5">
    <div class="container">
      <!-- Header -->
      <header class="d-flex justify-content-between align-items-end flex-wrap gap-3 pb-3 mb-4 cl-border-b">
        <div>
          <RouterLink
            :to="`/profile/${route.params.username}`"
            class="back-link cl-muted small text-decoration-none d-inline-flex align-items-center gap-1 mb-2"
          >
            ← Back to profile
          </RouterLink>
          <h1 class="cl-display page-title mb-1">
            <span>@{{ route.params.username }}</span>'s
            <span class="cl-accent">connections</span>
          </h1>
          <p class="cl-muted small mb-0">
            {{ usersForTab.length }}
            {{ activeTab === 'followers'
                ? (usersForTab.length === 1 ? 'follower' : 'followers')
                : 'following' }}
          </p>
        </div>

        <!-- Search -->
        <div class="search-wrap">
          <input
            v-model="search"
            type="text"
            class="form-control bg-dark text-light border-secondary"
            placeholder="Filter by name or @handle…"
          />
        </div>
      </header>

      <!-- Tabs -->
      <div class="filter-tabs mb-4" role="tablist">
        <button
          type="button"
          class="filter-tab"
          :class="{ 'filter-tab-active': activeTab === 'followers' }"
          @click="setTab('followers')"
        >
          Followers
          <span class="filter-count">{{ followers.length }}</span>
        </button>
        <button
          type="button"
          class="filter-tab"
          :class="{ 'filter-tab-active': activeTab === 'following' }"
          @click="setTab('following')"
        >
          Following
          <span class="filter-count">{{ following.length }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5 cl-muted">
        <p class="mb-0">Loading…</p>
      </div>

      <!-- Empty -->
      <div
        v-else-if="filteredUsers.length === 0"
        class="cl-card empty-state p-5 text-center mx-auto"
      >
        <div class="empty-icon mb-3">{{ activeTab === 'followers' ? '👥' : '🔭' }}</div>
        <h2 class="cl-display h5 mb-2">
          <template v-if="search">No matches for "{{ search }}"</template>
          <template v-else-if="activeTab === 'followers'">
            No followers yet
          </template>
          <template v-else>
            Not following anyone yet
          </template>
        </h2>
        <p v-if="!search" class="cl-muted mb-0">
          <template v-if="activeTab === 'followers'">
            When someone follows @{{ route.params.username }}, they'll show up here.
          </template>
          <template v-else>
            @{{ route.params.username }} hasn't followed anyone yet.
          </template>
        </p>
      </div>

      <!-- User cards grid -->
      <div v-else class="row g-3">
        <div
          v-for="u in filteredUsers"
          :key="u.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <div class="user-card cl-card p-3 d-flex align-items-center gap-3">
            <RouterLink :to="`/profile/${u.username}`" class="flex-shrink-0">
              <img
                :src="avatarUrl(u, 96)"
                :alt="u.displayName"
                class="user-avatar"
              />
            </RouterLink>

            <div class="flex-grow-1 min-w-0">
              <RouterLink
                :to="`/profile/${u.username}`"
                class="user-name text-decoration-none d-block"
              >{{ u.displayName }}</RouterLink>
              <p class="cl-dim small mb-1">@{{ u.username }}</p>
              <p v-if="u.bio" class="user-bio cl-muted small mb-0">{{ u.bio }}</p>
            </div>

            <!-- Follow toggle (only when viewer is signed in and not themself) -->
            <button
              v-if="auth.isAuthenticated && u.id !== auth.user?.id"
              type="button"
              class="cl-btn cl-btn-sm flex-shrink-0"
              :class="u.isFollowing ? 'cl-btn-ghost' : 'cl-btn-primary'"
              :disabled="pendingId === u.id"
              @click="toggleFollow(u)"
            >
              <span v-if="pendingId === u.id">…</span>
              <span v-else>{{ u.isFollowing ? '✓ Following' : '+ Follow' }}</span>
            </button>
            <span
              v-else-if="auth.isAuthenticated && u.id === auth.user?.id"
              class="cl-badge cl-badge-accent flex-shrink-0"
            >You</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { avatarUrl } from '../utils/avatar'

const API = 'http://localhost:3000/api'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

// ── State ───────────────────────────────────────────────────────────
const followers = ref([])
const following = ref([])
const loading   = ref(true)
const pendingId = ref(null) // user id whose follow toggle is in-flight
const search    = ref('')

// `activeTab` mirrors the `?tab=` query string so deep links work and
// users can switch tabs by URL too.
const activeTab = ref(route.query.tab === 'following' ? 'following' : 'followers')

// ── Computed ────────────────────────────────────────────────────────
const usersForTab = computed(() =>
  activeTab.value === 'followers' ? followers.value : following.value
)

const filteredUsers = computed(() => {
  if (!search.value.trim()) return usersForTab.value
  const q = search.value.toLowerCase()
  return usersForTab.value.filter(u =>
    u.displayName.toLowerCase().includes(q) ||
    u.username.toLowerCase().includes(q)
  )
})

// ── Data loading ────────────────────────────────────────────────────
// Both lists are loaded up-front so flipping tabs is instant and the
// "Followers (N) | Following (N)" counts always render correctly.
async function loadConnections() {
  loading.value = true
  try {
    const headers = auth.token ? { Authorization: `Bearer ${auth.token}` } : {}

    const [followersRes, followingRes] = await Promise.all([
      fetch(`${API}/users/${route.params.username}/followers`, { headers }),
      fetch(`${API}/users/${route.params.username}/following`, { headers }),
    ])

    if (!followersRes.ok || !followingRes.ok) {
      followers.value = []
      following.value = []
      return
    }

    const [fa, fb] = await Promise.all([followersRes.json(), followingRes.json()])
    followers.value = fa.users || []
    following.value = fb.users || []
  } catch (err) {
    console.error('Connections load failed:', err)
    followers.value = []
    following.value = []
  } finally {
    loading.value = false
  }
}

// ── Actions ─────────────────────────────────────────────────────────
function setTab(name) {
  activeTab.value = name
  // Update the URL so refreshing keeps the same tab and shareable links work.
  router.replace({
    query: { ...route.query, tab: name },
  })
}

// Toggle follow on a user shown in either list. The user object is the
// same reference in followers/following arrays, so flipping `isFollowing`
// updates both views without a refetch.
async function toggleFollow(user) {
  if (!auth.isAuthenticated || user.id === auth.user?.id) return
  pendingId.value = user.id
  try {
    const res = await fetch(`${API}/users/${user.username}/follow`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Could not update follow.')
      return
    }

    // Flip the flag everywhere this user appears.
    updateUserEverywhere(user.id, { isFollowing: data.isFollowing })
  } catch (err) {
    console.error('Follow toggle failed:', err)
  } finally {
    pendingId.value = null
  }
}

function updateUserEverywhere(userId, patch) {
  for (const list of [followers.value, following.value]) {
    const found = list.find(u => u.id === userId)
    if (found) Object.assign(found, patch)
  }
}

// ── Lifecycle ───────────────────────────────────────────────────────
onMounted(loadConnections)

watch(() => route.params.username, (newName, oldName) => {
  if (newName && newName !== oldName) loadConnections()
})

watch(() => route.query.tab, (newTab) => {
  if (newTab === 'followers' || newTab === 'following') {
    activeTab.value = newTab
  }
})
</script>

<style scoped>
.connections-page { min-height: 70vh; }

.page-title {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  letter-spacing: 0.04em;
  line-height: 1.1;
  color: var(--cl-text);
}
.page-title span:first-child { color: var(--cl-text); }
.back-link { transition: color var(--cl-transition); }
.back-link:hover { color: var(--cl-accent) !important; }

.search-wrap { width: 100%; max-width: 280px; }

/* -- Filter pills (matches WatchlistView/ProfileView) -- */
.filter-tabs {
  display: inline-flex;
  gap: 4px;
  background: var(--cl-surface);
  border: 1px solid var(--cl-border);
  border-radius: 100px;
  padding: 4px;
}
.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border-radius: 100px;
  background: transparent;
  border: none;
  font-size: 0.85rem;
  color: var(--cl-text-muted);
  font-family: var(--cl-font-body);
  cursor: pointer;
  transition: all var(--cl-transition);
}
.filter-tab:hover { color: var(--cl-text); }
.filter-tab-active {
  background: var(--cl-accent);
  color: var(--cl-bg);
  font-weight: 500;
}
.filter-count {
  font-size: 0.72rem;
  padding: 1px 7px;
  border-radius: 100px;
  background: rgba(255,255,255,0.08);
}
.filter-tab-active .filter-count {
  background: rgba(0,0,0,0.18);
  color: var(--cl-bg);
}

/* -- User cards -- */
.user-card {
  transition: border-color var(--cl-transition), transform var(--cl-transition);
}
.user-card:hover {
  border-color: var(--cl-border-hover);
  transform: translateY(-2px);
}
.user-avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--cl-border);
}
.user-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--cl-text);
}
.user-name:hover { color: var(--cl-accent); }
.user-bio {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.min-w-0 { min-width: 0; }

/* -- Empty state -- */
.empty-state {
  border-style: dashed;
  max-width: 560px;
}
.empty-icon { font-size: 3rem; opacity: 0.6; }

@media (max-width: 575.98px) {
  .filter-tab { padding: 6px 12px; font-size: 0.8rem; }
  .user-avatar { width: 48px; height: 48px; }
}
</style>
