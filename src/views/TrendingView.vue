<template>
  <div class="trending-page">

    <!-- Hero Section -->
    <section class="trending-hero py-5 position-relative text-light">
      <img
        src="https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1400&q=80"
        alt="Trending Hero"
        class="w-100 hero-img position-absolute top-0 start-0"
      />
      <div class="hero-gradient position-absolute top-0 start-0 w-100 h-100"></div>

      <div class="container position-relative text-center py-5">
        <p class="eyebrow text-warning mb-2">Popularity</p>
        <h1 class="display-4 fw-bold mb-3">Most Popular Movies</h1>
        <p class="hero-description text-light mx-auto" style="max-width: 720px;">
          Explore the most popular movies that people are talking about.
        </p>
      </div>

      <!-- Sort Panel -->
      <div class="container mt-4">
        <div class="d-flex justify-content-end gap-3 sort-panel mx-auto p-3 rounded">

          <span class="sort-label text-light fw-semibold">Sort by</span>

          <div class="sort-select position-relative">
            <select v-model="sortBy" class="form-select sort-dropdown text-light border-secondary">
              <option value="rating">IMDb rating</option>
              <option value="reviewCount">Review count</option>
            </select>
            <span class="select-arrow">▾</span>
          </div>

          <button
            type="button"
            class="sort-toggle"
            @click="toggleSortOrder"
          >
            <span class="direction-arrow">
              {{ sortOrder === 'desc' ? '⇩' : '⇧' }}
            </span>
          </button>

        </div>
      </div>
    </section>

    <!-- Ranked List -->
    <section class="ranked-section py-5">
      <div class="container">

        <div class="ranked-list d-flex flex-column gap-4">

          <div
            v-for="(media, index) in normalizedMovies"
            :key="media.id"
            class="ranked-item position-relative"
          >

            <div class="rank-badge">
              {{ index + 1 }}
            </div>

            <div class="rank-card d-flex flex-column flex-md-row gap-3 p-3 rounded bg-dark border border-secondary">

              <img :src="media.poster" :alt="media.title" class="rank-poster rounded" />

              <div class="rank-data d-flex flex-column gap-2 flex-grow-1">

                <div class="rank-header d-flex justify-content-between align-items-center">
                  <h2 class="h5 mb-1 text-light">{{ media.title }}</h2>

                  <span class="badge bg-warning text-dark">
                    {{ media.type === 'tv' ? 'TV' : 'Film' }}
                  </span>
                </div>

                <p class="media-subtitle text-muted mb-1">
                  {{ media.year }} · {{ (media.genre || []).join(', ') }}
                </p>

                <p class="media-synopsis text-light mb-2">
                  {{ media.synopsis }}
                </p>

                <div class="rank-stats d-flex gap-2 flex-wrap mb-2">
                  <span class="stat badge bg-secondary text-warning">
                    ★ {{ (media.rating || 0).toFixed(1) }}
                  </span>

                  <span class="stat badge bg-secondary text-light">
                    ✍ {{ media.reviewCount || 0 }} reviews
                  </span>
                </div>

                <RouterLink
                  :to="{
                    name: 'MediaDetail',
                    params: { id: media.id },
                    query: { type: media.type }
                  }"
                  class="btn btn-outline-warning btn-sm w-auto"
                >
                  View details
                </RouterLink>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMediaStore } from '../stores/media'

const mediaStore = useMediaStore()

const sortBy = ref('rating')
const sortOrder = ref('desc')
const activeTab = ref('all')
const currentPage = ref(1)
const totalPages = ref(1)

async function load() {
  const pages = await mediaStore.loadPopular(activeTab.value, currentPage.value)
  if (pages) totalPages.value = pages
}

onMounted(() => {
  load()
})

watch(activeTab, () => {
  currentPage.value = 1
  load()
})

watch(currentPage, () => {
  load()
})

/**
 * 🔥 FIX: normalize type everywhere
 */
const normalizedMovies = computed(() => {
  return (mediaStore.movies || []).map(m => ({
    ...m,
    type: m.type || m.media_type || 'movie'
  }))
})

const sortedMovies = computed(() => {
  const list = [...normalizedMovies.value]

  const order = sortOrder.value === 'asc' ? 1 : -1

  return list.sort((a, b) => {
    if (sortBy.value === 'reviewCount') {
      return order * ((a.reviewCount || 0) - (b.reviewCount || 0))
    }
    return order * ((a.rating || 0) - (b.rating || 0))
  })
})

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}
</script>