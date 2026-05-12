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
            <select v-model="sortBy" class="form-select bg-dark text-light border-secondary">
              <option value="rating">IMDb rating</option>
              <option value="reviewCount">Review count</option>
            </select>
            <span class="select-arrow text-muted">▾</span>
          </div>
          <button type="button" class="sort-toggle btn btn-sm btn-outline-light" 
            @click="toggleSortOrder" 
            :title="sortOrder === 'desc' ? 'Sort ascending' : 'Sort descending'">
            <span class="direction-arrow">{{ sortOrder === 'desc' ? '⇩' : '⇧' }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Ranked Movies List (original vertical layout) -->
    <section class="ranked-section py-5">
      <div class="container">
        <div class="ranked-list d-flex flex-column gap-4">
          <div v-for="(media, index) in sortedMovies" :key="media.id" class="ranked-item position-relative">
            <div class="rank-badge d-flex align-items-center justify-content-center fw-bold">{{ index + 1 }}</div>
            <div class="rank-card d-flex flex-column flex-md-row gap-3 p-3 rounded bg-dark border border-secondary">
              <img :src="media.poster" :alt="media.title" class="rank-poster rounded" />
              <div class="rank-data d-flex flex-column gap-2 flex-grow-1">
                <div class="rank-header d-flex justify-content-between align-items-center">
                  <h2 class="h5 mb-1 text-light">{{ media.title }}</h2>
                  <span class="badge bg-warning text-dark">{{ media.type === 'tv' ? 'TV' : 'Film' }}</span>
                </div>
                <p class="media-subtitle text-muted mb-1">{{ media.year }} · {{ media.genre.join(', ') }}</p>
                <p class="media-synopsis text-light mb-2">{{ media.synopsis }}</p>
                <div class="rank-stats d-flex gap-2 flex-wrap mb-2">
                  <span class="stat badge bg-secondary text-warning">★ {{ media.rating.toFixed(1) }}</span>
                  <span class="stat badge bg-secondary text-light">✍ {{ media.reviewCount }} reviews</span>
                </div>
                <RouterLink :to="`/media/${media.id}`" class="btn btn-outline-warning btn-sm w-auto">View details</RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMediaStore } from '../stores/media'

const mediaStore = useMediaStore()
const sortBy = ref('rating')
const sortOrder = ref('desc')

const sortedMovies = computed(() => {
  return [...mediaStore.movies].sort((a, b) => {
    const order = sortOrder.value === 'asc' ? 1 : -1
    if (sortBy.value === 'reviewCount') return order * (a.reviewCount - b.reviewCount)
    return order * (a.rating - b.rating)
  })
})

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}
</script>

<style scoped>
/* Hero Section */
.trending-hero {
  min-height: 50vh;
  position: relative;
  overflow: hidden;
}
.hero-img {
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
}
.hero-gradient {
  background: linear-gradient(to bottom, rgba(15,18,32,0.95), rgba(15,18,32,0.85));
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* Hero Text */
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.15em;
}
.hero-description {
  color: #ccc;
}

/* Sort Panel */
.sort-panel {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  border-radius: 12px;
}
.sort-select select {
  background: #12121a;
  border: 1px solid #2c2c38;
  color: #f5f5f5;
  border-radius: 8px;
  padding: 6px 30px 6px 10px;
}

/* Ranked Cards (Original Vertical Layout) */
.ranked-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.ranked-item {
  position: relative;
}
.rank-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  width: 38px;
  height: 38px;
  background: #ffc107;
  color: #0a0a0f;
  font-weight: 700;
  border-radius: 50%;
  display: grid;
  place-items: center;
  z-index: 1;
  box-shadow: 0 6px 18px rgba(0,0,0,0.3);
}
.rank-card {
  display: flex;
  flex-direction: row;
  gap: 20px;
  padding: 20px;
  border-radius: 24px;
  border: 1px solid #2c2c38;
  background: #12121a;
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}
.rank-poster {
  width: 120px;
  height: 180px;
  object-fit: cover;
  border-radius: 16px;
}
.rank-data {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-grow: 1;
}
.rank-header h2 {
  color: #f5f5f5;
}
.media-subtitle {
  color: #b0b0b0;
}
.media-synopsis {
  color: #ccc;
}
.rank-stats .stat {
  background: rgba(255,255,255,0.08);
  padding: 4px 8px;
  border-radius: 999px;
}
.rank-stats .rating {
  color: #ffc107;
}

/* Responsive */
@media (max-width: 768px) {
  .rank-card {
    flex-direction: column;
  }
  .rank-poster {
    width: 100%;
    height: auto;
  }
}
</style>