<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg">
        <img :src="featured.backdrop" :alt="featured.title" />
        <div class="hero-gradient"></div>
      </div>
      <div class="container hero-content">
        <div class="hero-meta">
          <span class="badge badge-type">{{ featured.type === 'tv' ? 'TV Series' : 'Film' }}</span>
          <span class="hero-year">{{ featured.year }}</span>
        </div>
        <h1 class="hero-title">{{ featured.title }}</h1>
        <p class="hero-synopsis">{{ featured.synopsis }}</p>
        <div class="hero-rating">
          <span class="rating-star">★</span>
          <span class="rating-val">{{ featured.rating }}</span>
          <span class="rating-sep">/10</span>
          <span class="rating-count">{{ featured.reviewCount }} reviews</span>
        </div>
        <div class="hero-actions">
          <RouterLink :to="`/media/${featured.id}`" class="btn btn-primary">View Details</RouterLink>
          <button v-if="auth.isAuthenticated" class="btn btn-ghost" @click="mediaStore.toggleWatchlist(featured.id)">
            {{ mediaStore.isInWatchlist(featured.id) ? '✓ In Watchlist' : '+ Watchlist' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Trending strip -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">Trending <span>Now</span></h2>
        <div class="media-grid">
          <MediaCard v-for="m in mediaStore.trending" :key="m.id" :media="m" />
        </div>
        <div style="text-align:center;margin-top:28px;">
          <RouterLink to="/trending" class="btn btn-ghost">See all trending →</RouterLink>
        </div>
      </div>
    </section>

    <!-- Recent reviews feed -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">Latest <span>Reviews</span></h2>
        <div class="reviews-feed">
          <div v-for="review in recentReviews" :key="review.id" class="feed-item">
            <ReviewCard :review="review" />
            <div class="feed-media">
              <RouterLink :to="`/media/${review.mediaId}`" class="feed-media-link">
                <img :src="getMedia(review.mediaId)?.poster" :alt="getMedia(review.mediaId)?.title" />
                <span>{{ getMedia(review.mediaId)?.title }}</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMediaStore } from '../stores/media'
import { useAuthStore } from '../stores/auth'
import MediaCard from '../components/MediaCard.vue'
import ReviewCard from '../components/ReviewCard.vue'

const mediaStore = useMediaStore()
const auth = useAuthStore()

const featured = computed(() => mediaStore.movies[1]) // Oppenheimer as hero
const recentReviews = computed(() => [...mediaStore.reviews].slice(0, 4))
function getMedia(id) { return mediaStore.getMovieById(id) }
</script>

<style scoped>
.hero { position: relative; min-height: 70vh; display: flex; align-items: flex-end; overflow: hidden; }
.hero-bg { position: absolute; inset: 0; }
.hero-bg img { width: 100%; height: 100%; object-fit: cover; opacity: 0.35; }
.hero-gradient { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg) 0%, rgba(10,10,15,0.4) 60%, transparent 100%); }
.hero-content { position: relative; z-index: 1; padding-bottom: 60px; max-width: 640px; }
.hero-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.hero-year { font-size: 0.85rem; color: var(--text-muted); }
.hero-title { font-family: var(--font-display); font-size: clamp(2.8rem, 6vw, 5rem); letter-spacing: 0.04em; line-height: 0.95; margin-bottom: 16px; }
.hero-synopsis { font-size: 0.95rem; color: var(--text-muted); line-height: 1.7; margin-bottom: 20px; max-width: 520px; }
.hero-rating { display: flex; align-items: center; gap: 6px; margin-bottom: 24px; }
.rating-star { color: var(--accent); font-size: 1.1rem; }
.rating-val { font-size: 1.4rem; font-weight: 600; color: var(--accent); }
.rating-sep { color: var(--text-dim); }
.rating-count { font-size: 0.82rem; color: var(--text-muted); margin-left: 4px; }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.section { padding: 60px 0; }
.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
.reviews-feed { display: flex; flex-direction: column; gap: 16px; }
.feed-item { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; }
.feed-media-link { display: flex; flex-direction: column; gap: 6px; width: 80px; }
.feed-media-link img { width: 80px; height: 120px; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--border); }
.feed-media-link span { font-size: 0.7rem; color: var(--text-muted); text-align: center; line-height: 1.3; }
@media (max-width: 600px) {
  .feed-item { grid-template-columns: 1fr; }
  .feed-media { display: none; }
}
</style>
