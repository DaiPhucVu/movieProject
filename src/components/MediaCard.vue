<template>
  <RouterLink :to="{ name: 'MediaDetail', params: { id: media.id }, query: { type: media.type } }" class="media-card">
    <div class="card-poster">
      <img :src="media.poster" :alt="media.title" loading="lazy" />
      <div class="card-overlay">
        <div class="card-rating">
          <span class="star-icon">★</span> {{ media.rating }}
        </div>
        <span class="badge badge-type">{{ media.type === 'tv' ? 'TV' : 'Film' }}</span>
      </div>
      <button v-if="showWatchlist && auth.isAuthenticated" class="watchlist-btn" @click.prevent="toggleWatchlist" :class="{ active: inWatchlist }">
        {{ inWatchlist ? '✓' : '+' }}
      </button>
    </div>
    <div class="card-info">
      <h3 class="card-title">{{ media.title }}</h3>
      <div class="card-meta">
        <span class="card-year">{{ media.year }}</span>
        <span class="card-sep">·</span>
        <span class="card-genre">{{ media.genre[0] }}</span>
      </div>
      <div class="card-stats">
        <span class="stat">❤ {{ formatNum(media.likes) }}</span>
        <span class="stat">✍ {{ formatNum(media.reviewCount) }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useMediaStore } from '../stores/media'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  media: { type: Object, required: true },
  showWatchlist: { type: Boolean, default: true },
})

const mediaStore = useMediaStore()
const auth = useAuthStore()
// Id-only match — one watchlist slot per TMDB id.
const inWatchlist = computed(() => mediaStore.isInWatchlist(props.media.id))

function toggleWatchlist() {
  if (!auth.isAuthenticated) return
  mediaStore.toggleWatchlist(props.media.id, props.media.type)
}

function formatNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n
}
</script>

<style scoped>
.media-card {
  display: block; border-radius: var(--radius-lg);
  overflow: hidden; background: var(--surface);
  border: 1px solid var(--border);
  transition: all 0.25s ease; position: relative;
}
.media-card:hover { transform: translateY(-4px); border-color: var(--border-hover); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.card-poster { position: relative; aspect-ratio: 2/3; overflow: hidden; }
.card-poster img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.media-card:hover .card-poster img { transform: scale(1.04); }
.card-overlay {
  position: absolute; top: 0; left: 0; right: 0;
  padding: 10px 10px;
  display: flex; justify-content: space-between; align-items: flex-start;
  background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%);
}
.card-rating {
  display: flex; align-items: center; gap: 3px;
  background: rgba(0,0,0,0.6); padding: 3px 8px; border-radius: 100px;
  font-size: 0.78rem; font-weight: 600; color: var(--accent);
  backdrop-filter: blur(4px);
}
.star-icon { font-size: 0.7rem; }
.watchlist-btn {
  position: absolute; bottom: 10px; right: 10px;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.7); color: var(--text);
  font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px); border: 1px solid var(--border);
  transition: all var(--transition); z-index: 2;
}
.watchlist-btn:hover, .watchlist-btn.active { background: var(--accent); color: var(--bg); border-color: var(--accent); }
.card-info { padding: 12px 14px 14px; }
.card-title { font-size: 0.92rem; font-weight: 500; margin-bottom: 4px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-meta { display: flex; align-items: center; gap: 5px; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px; }
.card-sep { color: var(--text-dim); }
.card-stats { display: flex; gap: 12px; font-size: 0.75rem; color: var(--text-dim); }
</style>