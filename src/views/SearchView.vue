<template>
  <div class="search-page">
    <div class="container">
      <h1 class="cl-display page-title">Search <span class="cl-accent">Films & Series</span></h1>

      <!-- Search Bar -->
      <div class="search-bar">
        <input
          v-model="query"
          type="text"
          placeholder="Search movies, TV shows..."
          class="search-input"
        />
      </div>

      <!-- Filters -->
      <div class="filters">
        <select v-model="filters.type" class="filter-select">
          <option value="">All Types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>

        <select v-model="filters.genre" class="filter-select">
          <option value="">All Genres</option>
          <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
        </select>

        <select v-model="filters.sort" class="filter-select">
          <option value="relevance">Sort: Relevance</option>
          <option value="rating_desc">Highest Rated</option>
          <option value="year_desc">Newest First</option>
          <option value="popular">Most Popular</option>
        </select>

        <input v-model="filters.year" type="number" placeholder="Year" class="filter-select year-input" />

        <button @click="resetFilters" class="btn btn-ghost">Reset</button>
      </div>

      <!-- Results count -->
      <p v-if="results.length" class="results-meta">{{ results.length }} results for "{{ query || 'all' }}"</p>
      <p v-else-if="query" class="results-meta dim">No results found for "{{ query }}"</p>

      <!-- Grid -->
      <div class="media-grid">
        <MediaCard v-for="m in results" :key="m.id" :media="m" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useMediaStore } from '../stores/media'
import MediaCard from '../components/MediaCard.vue'

const mediaStore = useMediaStore()

const query = ref('')
const filters = reactive({ type: '', genre: '', sort: 'relevance', year: '' })
const genres = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Animation']

const results = computed(() => {
  let list = [...mediaStore.movies]

  if (query.value)
    list = list.filter(m => m.title.toLowerCase().includes(query.value.toLowerCase()))
  if (filters.type)
    list = list.filter(m => m.type === filters.type)
  if (filters.genre)
    list = list.filter(m => m.genre?.includes(filters.genre))
  if (filters.year)
    list = list.filter(m => m.year === parseInt(filters.year))

  if (filters.sort === 'rating_desc') list.sort((a, b) => b.rating - a.rating)
  else if (filters.sort === 'year_desc') list.sort((a, b) => b.year - a.year)
  else if (filters.sort === 'popular') list.sort((a, b) => b.reviewCount - a.reviewCount)

  return list
})

function resetFilters() {
  query.value = ''
  filters.type = ''
  filters.genre = ''
  filters.sort = 'relevance'
  filters.year = ''
}
</script>

<style scoped>
.search-page { padding: 48px 0 80px; }
.page-title { font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: 0.04em; margin-bottom: 28px; }

.search-bar { margin-bottom: 20px; }
.search-input {
  width: 100%;
  background: var(--cl-surface);
  border: 1.5px solid var(--cl-border);
  border-radius: var(--cl-radius);
  color: var(--cl-text);
  font-size: 1rem;
  padding: 14px 18px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--cl-accent); }
.search-input::placeholder { color: var(--cl-text-dim); }

.filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
.filter-select {
  background: var(--cl-surface);
  border: 1px solid var(--cl-border);
  border-radius: var(--cl-radius);
  color: var(--cl-text);
  font-size: 0.88rem;
  padding: 8px 12px;
  outline: none;
  cursor: pointer;
}
.filter-select:focus { border-color: var(--cl-accent); }
.year-input { width: 100px; }

.results-meta { font-size: 0.85rem; color: var(--cl-text-muted); margin-bottom: 20px; }
.results-meta.dim { color: var(--cl-text-dim); }

.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
</style>