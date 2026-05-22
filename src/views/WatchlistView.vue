<template>
  <div class="watchlist-page py-5">
    <div class="container">
      <!-- Page header -->
      <header class="d-flex justify-content-between align-items-end flex-wrap gap-3 pb-3 mb-4 cl-border-b">
        <div>
          <h1 class="cl-display page-title mb-1">
            My <span class="cl-accent">Watchlist</span>
          </h1>
          <p class="cl-muted small mb-0">
            <template v-if="loading">Loading…</template>
            <template v-else-if="watchlistMovies.length === 0">Nothing saved yet</template>
            <template v-else-if="watchlistMovies.length === 1">1 title saved</template>
            <template v-else>{{ watchlistMovies.length }} titles saved</template>
          </p>
        </div>

        <!-- Quick stats -->
        <div v-if="!loading && watchlistMovies.length > 0" class="d-flex gap-4">
          <div class="text-center">
            <div class="cl-display cl-accent stat-val">{{ movieCount }}</div>
            <div class="cl-dim stat-label">Films</div>
          </div>
          <div class="text-center">
            <div class="cl-display cl-accent stat-val">{{ tvCount }}</div>
            <div class="cl-dim stat-label">Series</div>
          </div>
          <div class="text-center">
            <div class="cl-display cl-accent stat-val">{{ avgRating }}</div>
            <div class="cl-dim stat-label">Avg ★</div>
          </div>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5 cl-muted">
        <p class="mb-0">Loading your watchlist…</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="watchlistMovies.length === 0" class="cl-card empty-state p-5 text-center mx-auto">
        <div class="empty-icon mb-3">🎬</div>
        <h2 class="cl-display h4 mb-2">Your watchlist is empty</h2>
        <p class="cl-muted mb-4">
          Save films and series you want to watch later. Start by exploring what's trending or search for something specific.
        </p>
        <div class="d-flex gap-2 justify-content-center flex-wrap">
          <RouterLink to="/trending" class="cl-btn cl-btn-primary">Browse Trending</RouterLink>
          <RouterLink to="/search" class="cl-btn cl-btn-ghost">Search Titles</RouterLink>
        </div>
      </div>

      <!-- Filter + sort + grid -->
      <template v-else>
        <div class="row g-3 align-items-center mb-4">
          <div class="col-12 col-md-7 col-lg-8">
            <div class="filter-tabs" role="tablist">
              <button
                v-for="opt in typeFilters" :key="opt.value"
                type="button"
                class="filter-tab"
                :class="{ 'filter-tab-active': typeFilter === opt.value }"
                @click="typeFilter = opt.value"
              >
                {{ opt.label }}
                <span class="filter-count">{{ countByType(opt.value) }}</span>
              </button>
            </div>
          </div>

          <div class="col-12 col-md-5 col-lg-4">
            <div class="d-flex align-items-center gap-2 justify-content-md-end">
              <label class="cl-dim sort-label" for="sort-watchlist">Sort by</label>
              <select id="sort-watchlist" v-model="sortBy" class="cl-select cl-btn-sm">
                <option value="added">Recently Added</option>
                <option value="title">Title (A–Z)</option>
                <option value="rating">Highest Rated</option>
                <option value="year">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Filtered empty state -->
        <div v-if="filteredSorted.length === 0" class="text-center py-5 cl-muted">
          <p class="mb-0">No {{ typeFilter === 'tv' ? 'series' : 'films' }} in your watchlist yet.</p>
        </div>

        <!-- Grid -->
        <div v-else>
          <div class="row g-3">
            <div
              v-for="m in pagedItems" :key="m.id"
              class="col-6 col-md-4 col-lg-3 col-xl-2"
            >
              <MediaCard :media="m" />
            </div>
          </div>

          <PaginationBar
            v-model:currentPage="currentPage"
            :totalPages="totalPages"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '../stores/media'
import { useAuthStore } from '../stores/auth'
import MediaCard from '../components/MediaCard.vue'
import PaginationBar from '../components/PaginationBar.vue'

const route = useRoute()
const mediaStore = useMediaStore()
const auth = useAuthStore()

const PAGE_SIZE = 12

const typeFilter = ref('all')
const sortBy = ref('added')
const currentPage = ref(1)
const loading = ref(false)

const typeFilters = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Series' },
]

// Resolve watchlist items into full movie objects via the TMDB store cache.
// Items that couldn't be loaded (e.g. network failure) are skipped.
const watchlistMovies = computed(() => {
  return mediaStore.watchlist
    .map(item => mediaStore.getMovieById(item.mediaId, item.type || 'movie'))
    .filter(m => m != null)
})

const movieCount = computed(() => watchlistMovies.value.filter(m => m.type === 'movie').length)
const tvCount = computed(() => watchlistMovies.value.filter(m => m.type === 'tv').length)

const avgRating = computed(() => {
  if (watchlistMovies.value.length === 0) return '–'
  const sum = watchlistMovies.value.reduce((acc, m) => acc + (m.rating || 0), 0)
  return (sum / watchlistMovies.value.length).toFixed(1)
})

function countByType(t) {
  if (t === 'all') return watchlistMovies.value.length
  return watchlistMovies.value.filter(m => m.type === t).length
}

const filteredSorted = computed(() => {
  let list = watchlistMovies.value
  if (typeFilter.value !== 'all') {
    list = list.filter(m => m.type === typeFilter.value)
  }
  list = [...list]
  switch (sortBy.value) {
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title))
    case 'rating':
      return list.sort((a, b) => b.rating - a.rating)
    case 'year':
      return list.sort((a, b) => b.year - a.year)
    case 'added':
    default:
      return list
  }
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSorted.value.length / PAGE_SIZE))
)

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredSorted.value.slice(start, start + PAGE_SIZE)
})

watch([typeFilter, sortBy], () => { currentPage.value = 1 })
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal
})

// ── Data loading ──
// 1. Fetch the user's watchlist (array of {mediaId, type} from backend)
// 2. For each item, ask the store to load its TMDB detail into the cache
//    (loadDetail caches in detailCache, getMovieById reads from there)
async function loadWatchlist() {
  if (!auth.isAuthenticated || !auth.user?.id) return
  loading.value = true
  try {
    await mediaStore.fetchWatchlist(auth.user.id)

    // Load TMDB detail for each watchlist item in parallel.
    // Failures are caught so a single bad item doesn't block the rest.
    await Promise.all(
      mediaStore.watchlist.map(item =>
        mediaStore.loadDetail(item.mediaId, item.type).catch(err => {
          console.warn(`Could not load detail for ${item.type}/${item.mediaId}:`, err)
        })
      )
    )
  } catch (err) {
    console.error('Watchlist load failed:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadWatchlist)

// Safety net: re-fetch when arriving at /watchlist via router navigation
watch(
  () => route.fullPath,
  (newPath) => { if (newPath === '/watchlist') loadWatchlist() }
)
</script>

<style scoped>
.watchlist-page { min-height: 70vh; }

/* -- Header -- */
.page-title {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  letter-spacing: 0.04em;
  line-height: 1;
  color: var(--cl-text);
}

.stat-val {
  font-size: 1.8rem;
  letter-spacing: 0.04em;
  line-height: 1;
}
.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: 6px;
}

/* -- Empty state -- */
.empty-state {
  border-style: dashed;
  max-width: 560px;
}
.empty-icon {
  font-size: 3rem;
  opacity: 0.6;
}

/* -- Filter pills -- */
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
.filter-tab:hover {
  color: var(--cl-text);
}
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

.sort-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

@media (max-width: 767.98px) {
  .filter-tabs { width: 100%; overflow-x: auto; }
  .filter-tab { flex-shrink: 0; }
}
@media (max-width: 575.98px) {
  .filter-tab { padding: 6px 12px; font-size: 0.8rem; }
}
</style>