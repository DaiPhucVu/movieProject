<template>
  <div class="trending-page">
    <section class="section trending-hero">
      <div class="container hero-content">
        <div class="hero-copy">
          <p class="eyebrow">Popularity</p>
          <h1>Most Popular Movies</h1>
          <p class="hero-description">
            Explore the most popular movies that people are talking about.
          </p>
        </div>
      </div>
      <div class="container sort-row">
        <div class="sort-panel">
          <span class="sort-label">Sort by</span>
          <div class="sort-select">
            <select id="sortBy" v-model="sortBy">
              <option value="rating">IMDb rating</option>
              <option value="reviewCount">Review count</option>
            </select>
            <span class="select-arrow">▾</span>
          </div>
          <button type="button" class="sort-toggle" @click="toggleSortOrder" :title="sortOrder === 'desc' ? 'Sort ascending' : 'Sort descending'">
            <span class="direction-arrow">{{ sortOrder === 'desc' ? '⇩' : '⇧' }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="section ranked-section">
      <div class="container">
        <div class="ranked-list">
          <div v-for="(media, index) in sortedMovies" :key="media.id" class="ranked-item">
            <div class="rank-badge">{{ index + 1 }}</div>
            <div class="rank-card">
              <img :src="media.poster" :alt="media.title" class="rank-poster" loading="lazy" />
              <div class="rank-data">
                <div class="rank-header">
                  <h2>{{ media.title }}</h2>
                  <span class="media-type">{{ media.type === 'tv' ? 'TV' : 'Film' }}</span>
                </div>
                <p class="media-subtitle">{{ media.year }} · {{ media.genre.join(', ') }}</p>
                <p class="media-synopsis">{{ media.synopsis }}</p>
                <div class="rank-stats">
                  <span class="stat rating">★ {{ media.rating.toFixed(1) }}</span>
                  <span class="stat reviews">✍ {{ media.reviewCount }} reviews</span>
                </div>
                <RouterLink :to="`/media/${media.id}`" class="btn btn-ghost btn-small">View details</RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMediaStore } from '../stores/media'

const mediaStore = useMediaStore()
const sortBy = ref('rating')
const sortOrder = ref('desc')

const sortedMovies = computed(() => {
  return [...mediaStore.movies].sort((a, b) => {
    const order = sortOrder.value === 'asc' ? 1 : -1
    if (sortBy.value === 'reviewCount') {
      return order * (a.reviewCount - b.reviewCount)
    }
    return order * (a.rating - b.rating)
  })
})

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}
</script>

<style scoped>
.trending-hero { padding: 60px 0 40px; background: linear-gradient(180deg, rgba(15, 18, 32, 0.95), rgba(15, 18, 32, 0.85)), url('https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1400&q=80') center/cover no-repeat; color: var(--text);
}
.hero-content { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 32px; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.18em; color: var(--accent); font-weight: 700; margin-bottom: 10px; }
.hero-copy h1 { font-size: clamp(2.4rem, 4vw, 3.6rem); margin-bottom: 18px; max-width: 760px; }
.hero-description { max-width: 720px; line-height: 1.8; color: var(--text-muted); }
.sort-row { width: 100%; padding-top: 24px; }
.sort-row .container { max-width: 1200px; margin: 0 auto; }
.sort-panel { display: flex; align-items: center; justify-content: flex-end; width: auto; margin-left: auto; gap: 14px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 14px 18px; backdrop-filter: blur(10px); }
.sort-label { color: var(--text); font-size: 0.95rem; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; }
.sort-select { position: relative; width: 220px; max-width: 100%; }
.sort-select select { width: 100%; appearance: none; -webkit-appearance: none; -moz-appearance: none; padding: 12px 42px 12px 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.18); background: rgba(0,0,0,0.12); color: var(--text); font-size: 0.95rem; }
.sort-select select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.12); }
.select-arrow { position: absolute; top: 50%; right: 14px; transform: translateY(-50%); pointer-events: none; color: var(--text-muted); font-size: 0.95rem; }
.sort-toggle { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: 1px solid rgba(255,255,255,0.18); border-radius: 14px; background: rgba(255,255,255,0.06); color: var(--text); cursor: pointer; transition: background 0.2s ease; }
.sort-toggle:hover { background: rgba(255,255,255,0.12); }
.direction-arrow { font-size: 1rem; }

.ranked-section { padding: 0 0 60px; }
.ranked-list { display: grid; gap: 20px; }
.ranked-item { position: relative; }
.rank-badge { position: absolute; top: 14px; left: 14px; width: 38px; height: 38px; display: grid; place-items: center; background: var(--accent); color: var(--bg); font-weight: 700; border-radius: 50%; z-index: 1; box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18); }
.rank-card { display: grid; grid-template-columns: 120px 1fr; gap: 20px; padding: 20px; border-radius: 24px; border: 1px solid var(--border); background: var(--surface); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); }
.rank-poster { width: 100%; height: 100%; min-height: 180px; object-fit: cover; border-radius: 18px; }
.rank-data { display: flex; flex-direction: column; gap: 10px; }
.rank-header { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.rank-header h2 { font-size: 1.35rem; margin: 0; }
.media-type { font-size: 0.82rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); }
.media-subtitle { color: var(--text-muted); font-size: 0.92rem; }
.media-synopsis { color: var(--text-secondary); line-height: 1.7; margin: 0; }
.rank-stats { display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.95rem; color: var(--text-muted); }
.stat { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px; background: rgba(0, 0, 0, 0.04); }
.rating { color: var(--accent); }
.btn-small { padding: 10px 16px; font-size: 0.9rem; align-self: flex-start; }

@media (max-width: 900px) {
  .hero-content { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
  .rank-card { grid-template-columns: 1fr; }
  .rank-badge { top: 10px; left: 10px; }
}
</style>
