<template>
  <div class="watchlist-page">
    <div class="container">
      <!-- Page header -->
      <header class="page-header">
        <div class="header-text">
          <h1 class="page-title">My <span>Watchlist</span></h1>
          <p class="page-sub">
            <template v-if="loading">Loading…</template>
            <template v-else-if="watchlistMovies.length === 0">Nothing saved yet</template>
            <template v-else-if="watchlistMovies.length === 1">1 title saved</template>
            <template v-else>{{ watchlistMovies.length }} titles saved</template>
          </p>
        </div>

        <!-- Quick stats (only when there's something to show) -->
        <div v-if="!loading && watchlistMovies.length > 0" class="header-stats">
          <div class="stat-block">
            <div class="stat-val">{{ movieCount }}</div>
            <div class="stat-label">Films</div>
          </div>
          <div class="stat-block">
            <div class="stat-val">{{ tvCount }}</div>
            <div class="stat-label">Series</div>
          </div>
          <div class="stat-block">
            <div class="stat-val">{{ avgRating }}</div>
            <div class="stat-label">Avg ★</div>
          </div>
        </div>
      </header>

      <!-- Loading state -->
      <div v-if="loading" class="status-state">
        <p>Loading your watchlist…</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="watchlistMovies.length === 0" class="empty-state">
        <div class="empty-icon">🎬</div>
        <p class="empty-title">Your watchlist is empty</p>
        <p class="empty-sub">Save films and series you want to watch later. Start by exploring what's trending or search for something specific.</p>
        <div class="empty-actions">
          <RouterLink to="/trending" class="btn btn-primary">Browse Trending</RouterLink>
          <RouterLink to="/search" class="btn btn-ghost">Search Titles</RouterLink>
        </div>
      </div>

      <!-- Filter + Sort + Grid -->
      <template v-else>
        <div class="controls">
          <div class="row g-3 align-items-center">
            <div class="col-12 col-md-7 col-lg-8">
              <div class="filter-tabs" role="tablist">
                <button
                  v-for="opt in typeFilters" :key="opt.value"
                  class="filter-tab"
                  :class="{ active: typeFilter === opt.value }"
                  @click="typeFilter = opt.value"
                >
                  {{ opt.label }}
                  <span class="filter-count">{{ countByType(opt.value) }}</span>
                </button>
              </div>
            </div>

            <div class="col-12 col-md-5 col-lg-4">
              <div class="sort-control">
                <label class="sort-label" for="sort-watchlist">Sort by</label>
                <select id="sort-watchlist" v-model="sortBy" class="sort-select">
                  <option value="added">Recently Added</option>
                  <option value="title">Title (A–Z)</option>
                  <option value="rating">Highest Rated</option>
                  <option value="year">Newest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtered empty state -->
        <div v-if="filteredSorted.length === 0" class="empty-state-mini">
          <p>No {{ typeFilter === 'tv' ? 'series' : 'films' }} in your watchlist yet.</p>
        </div>

        <!-- Grid of cards -->
        <div v-else class="cards-section">
          <div class="row g-3 g-md-4">
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
import { useMediaStore } from '../stores/media'
import { useAuthStore } from '../stores/auth'
import MediaCard from '../components/MediaCard.vue'
import PaginationBar from '../components/PaginationBar.vue'

const mediaStore = useMediaStore()
const auth = useAuthStore()

const PAGE_SIZE = 12

const typeFilter = ref('all')
const sortBy = ref('added')
const currentPage = ref(1)
const loading = ref(true)

const typeFilters = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Series' },
]

// Use the store's built-in helper for the watchlist movies
const watchlistMovies = computed(() => mediaStore.getWatchlistMovies())

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

// Filter then sort
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
      return list // preserve insertion order from the backend
  }
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSorted.value.length / PAGE_SIZE))
)

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredSorted.value.slice(start, start + PAGE_SIZE)
})

// Reset to first page when filters change
watch([typeFilter, sortBy], () => { currentPage.value = 1 })

// If items are removed and the current page is now beyond the last page, snap back
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal
})

// ── Data loading ───────────────────────────────────────────────────────────
onMounted(async () => {
  if (auth.user?.id) {
    await mediaStore.fetchWatchlist(auth.user.id)
  }
  loading.value = false
})
</script>

<style scoped>
.watchlist-page { padding: 48px 0 80px; min-height: 70vh; }

/* ---------- Header ---------- */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  flex-wrap: wrap; gap: 24px;
  margin-bottom: 36px; padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}
.page-title {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  letter-spacing: 0.04em; line-height: 1;
  margin-bottom: 8px;
}
.page-title span { color: var(--accent); }
.page-sub { font-size: 0.9rem; color: var(--text-muted); }

.header-stats { display: flex; gap: 24px; }
.stat-block { text-align: center; }
.stat-val {
  font-family: var(--font-display);
  font-size: 1.8rem; color: var(--accent);
  letter-spacing: 0.04em; line-height: 1;
}
.stat-label {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text-dim); margin-top: 6px;
}

/* ---------- Status / empty ---------- */
.status-state {
  text-align: center; padding: 80px 20px;
  color: var(--text-muted); font-size: 0.95rem;
}

.empty-state {
  text-align: center; padding: 80px 24px;
  background: var(--surface); border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  max-width: 560px; margin: 0 auto;
}
.empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.6; }
.empty-title { font-family: var(--font-display); font-size: 1.6rem; letter-spacing: 0.03em; margin-bottom: 10px; }
.empty-sub { font-size: 0.92rem; color: var(--text-muted); line-height: 1.7; margin-bottom: 28px; max-width: 420px; margin-left: auto; margin-right: auto; }
.empty-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

.empty-state-mini {
  text-align: center; padding: 48px 20px;
  color: var(--text-muted); font-size: 0.92rem;
}

/* ---------- Controls ---------- */
.controls { margin-bottom: 32px; }

.filter-tabs {
  display: flex; gap: 4px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 100px; padding: 4px;
  width: fit-content;
}
.filter-tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 18px; border-radius: 100px;
  background: transparent; border: none;
  font-size: 0.85rem; color: var(--text-muted);
  font-family: var(--font-body); cursor: pointer;
  transition: all var(--transition);
}
.filter-tab:hover { color: var(--text); }
.filter-tab.active {
  background: var(--accent); color: var(--bg);
  font-weight: 500;
}
.filter-count {
  font-size: 0.72rem;
  padding: 1px 7px; border-radius: 100px;
  background: rgba(255,255,255,0.08);
}
.filter-tab.active .filter-count {
  background: rgba(0,0,0,0.18); color: var(--bg);
}

.sort-control {
  display: flex; align-items: center; gap: 10px;
  justify-content: flex-end;
}
.sort-label {
  font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text-dim);
}
.sort-select {
  background: var(--surface); color: var(--text);
  border: 1px solid var(--border); border-radius: 6px;
  padding: 7px 12px; font-size: 0.85rem; font-family: var(--font-body);
  cursor: pointer; flex-shrink: 0;
  transition: border-color var(--transition);
}
.sort-select:hover, .sort-select:focus { border-color: var(--border-hover); outline: none; }

/* ---------- Cards section ---------- */
.cards-section { margin-top: 8px; }

/* ---------- Responsive ---------- */
@media (max-width: 767.98px) {
  .watchlist-page { padding: 32px 0 60px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .header-stats { gap: 18px; }
  .stat-val { font-size: 1.4rem; }
  .filter-tabs { width: 100%; overflow-x: auto; }
  .filter-tab { flex-shrink: 0; }
  .sort-control { justify-content: flex-start; margin-top: 8px; }
}
@media (max-width: 575.98px) {
  .filter-tab { padding: 7px 14px; font-size: 0.8rem; }
}
</style>