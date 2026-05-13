<template>
  <div class="watchlist-page py-5">
    <div class="container">
      <!-- Page header -->
      <header class="d-flex justify-content-between align-items-end flex-wrap gap-3 pb-3 mb-4 border-bottom border-secondary">
        <div>
          <h1 class="display-5 fw-bold text-light mb-1">
            My <span class="text-warning">Watchlist</span>
          </h1>
          <p class="text-muted small mb-0">
            <template v-if="loading">Loading…</template>
            <template v-else-if="watchlistMovies.length === 0">Nothing saved yet</template>
            <template v-else-if="watchlistMovies.length === 1">1 title saved</template>
            <template v-else>{{ watchlistMovies.length }} titles saved</template>
          </p>
        </div>

        <!-- Quick stats -->
        <div v-if="!loading && watchlistMovies.length > 0" class="d-flex gap-4">
          <div class="text-center">
            <div class="fs-3 fw-bold text-warning lh-1">{{ movieCount }}</div>
            <div class="small text-muted text-uppercase mt-1 stat-label">Films</div>
          </div>
          <div class="text-center">
            <div class="fs-3 fw-bold text-warning lh-1">{{ tvCount }}</div>
            <div class="small text-muted text-uppercase mt-1 stat-label">Series</div>
          </div>
          <div class="text-center">
            <div class="fs-3 fw-bold text-warning lh-1">{{ avgRating }}</div>
            <div class="small text-muted text-uppercase mt-1 stat-label">Avg ★</div>
          </div>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5 text-muted">
        <p class="mb-0">Loading your watchlist…</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="watchlistMovies.length === 0" class="bg-dark border border-secondary rounded p-5 text-center mx-auto" style="max-width: 560px;">
        <div class="display-1 mb-3 opacity-50">🎬</div>
        <h2 class="h4 text-light mb-2">Your watchlist is empty</h2>
        <p class="text-muted mb-4">
          Save films and series you want to watch later. Start by exploring what's trending or search for something specific.
        </p>
        <div class="d-flex gap-2 justify-content-center flex-wrap">
          <RouterLink to="/trending" class="btn btn-primary">Browse Trending</RouterLink>
          <RouterLink to="/search" class="btn btn-outline-light">Search Titles</RouterLink>
        </div>
      </div>

      <!-- Filter + sort + grid -->
      <template v-else>
        <div class="row g-3 align-items-center mb-4">
          <div class="col-12 col-md-7 col-lg-8">
            <div class="btn-group" role="group" aria-label="Filter by type">
              <button
                v-for="opt in typeFilters" :key="opt.value"
                type="button"
                class="btn btn-sm"
                :class="typeFilter === opt.value ? 'btn-warning' : 'btn-outline-light'"
                @click="typeFilter = opt.value"
              >
                {{ opt.label }}
                <span class="badge ms-1" :class="typeFilter === opt.value ? 'bg-dark text-warning' : 'bg-secondary'">
                  {{ countByType(opt.value) }}
                </span>
              </button>
            </div>
          </div>

          <div class="col-12 col-md-5 col-lg-4">
            <div class="d-flex align-items-center gap-2 justify-content-md-end">
              <label class="small text-muted text-uppercase mb-0" for="sort-watchlist">Sort by</label>
              <select id="sort-watchlist" v-model="sortBy" class="form-select form-select-sm bg-dark text-light border-secondary w-auto">
                <option value="added">Recently Added</option>
                <option value="title">Title (A–Z)</option>
                <option value="rating">Highest Rated</option>
                <option value="year">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Filtered empty state -->
        <div v-if="filteredSorted.length === 0" class="text-center py-5 text-muted">
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

onMounted(async () => {
  if (auth.user?.id) {
    await mediaStore.fetchWatchlist(auth.user.id)
  }
  loading.value = false
})
</script>

<style scoped>
.watchlist-page { min-height: 70vh; }

.stat-label { letter-spacing: 0.08em; font-size: 0.7rem; }
</style>