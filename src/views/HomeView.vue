<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero position-relative d-flex align-items-end" style="min-height: 70vh;">
      <div class="hero-bg position-absolute inset-0">
        <img :src="featured.backdrop" :alt="featured.title" class="w-100 h-100 object-fit-cover opacity-25" />
        <div class="hero-gradient position-absolute inset-0"></div>
      </div>

      <div class="container position-relative pb-5">
        <div class="row">
          <div class="col-12 col-md-8">
            <div class="hero-meta d-flex align-items-center gap-2 mb-2">
              <span class="badge bg-primary">{{ featured.type === 'tv' ? 'TV Series' : 'Film' }}</span>
              <span class="text-muted small">{{ featured.year }}</span>
            </div>

            <h1 class="hero-title display-1">{{ featured.title }}</h1>
            <p class="text-muted">{{ featured.synopsis }}</p>

            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="text-warning fs-5">★</span>
              <span class="fw-semibold fs-4 text-warning">{{ featured.rating }}</span>
              <span class="text-muted">/10</span>
              <span class="small text-muted ms-1">{{ featured.reviewCount }} reviews</span>
            </div>

            <div class="d-flex flex-wrap gap-2">
              <RouterLink :to="`/media/${featured.id}`" class="btn btn-primary">View Details</RouterLink>
              <button v-if="auth.isAuthenticated" class="btn btn-outline-light"
                @click="mediaStore.toggleWatchlist(featured.id)">
                {{ mediaStore.isInWatchlist(featured.id) ? '✓ In Watchlist' : '+ Watchlist' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trending Section -->
    <section class="section py-5">
      <div class="container">
        <h2 class="section-title mb-4">Trending <span>Now</span></h2>
        <div class="row g-3">
          <div class="col-6 col-sm-4 col-md-3 col-lg-2" v-for="m in mediaStore.trending" :key="m.id">
            <MediaCard :media="m" />
          </div>
        </div>
        <div class="text-center mt-4">
          <RouterLink to="/trending" class="btn btn-outline-secondary">See all trending →</RouterLink>
        </div>
      </div>
    </section>

    <!-- Latest Reviews Section -->
    <section class="section py-5">
      <div class="container">
        <h2 class="section-title mb-4">Latest <span>Reviews</span></h2>
        <div class="row gy-3">
          <div v-for="review in recentReviews" :key="review.id" class="col-12">
            <div class="d-flex flex-wrap flex-md-nowrap align-items-start gap-3">
              <ReviewCard :review="review" />
              <div class="text-center" style="width:80px;">
                <RouterLink :to="`/media/${review.mediaId}`" class="d-flex flex-column gap-1">
                  <img :src="getMedia(review.mediaId)?.poster" :alt="getMedia(review.mediaId)?.title"
                    class="img-fluid rounded border" />
                  <span class="small text-muted">{{ getMedia(review.mediaId)?.title }}</span>
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
import { computed } from 'vue'
import { useMediaStore } from '../stores/media'
import { useAuthStore } from '../stores/auth'
import MediaCard from '../components/MediaCard.vue'
import ReviewCard from '../components/ReviewCard.vue'

const mediaStore = useMediaStore()
const auth = useAuthStore()

const featured = computed(() => mediaStore.movies[1]) // Example: featured movie
const recentReviews = computed(() => [...mediaStore.reviews].slice(0, 4))
function getMedia(id) { return mediaStore.getMovieById(id) }
</script>

<style scoped>
/* Hero background & gradient */
.hero-bg img {
  object-fit: cover;
}

.hero-gradient {
  background: linear-gradient(to top, var(--bg, #0a0a0f) 0%, rgba(10,10,15,0.4) 60%, transparent 100%);
}

/* Hero title responsive size */
.hero-title {
  font-family: var(--font-display, sans-serif);
  font-size: clamp(2rem, 6vw, 4rem);
  line-height: 1.1;
}

/* Responsive spacing for hero */
@media (max-width: 768px) {
  .hero-title {
    font-size: clamp(1.5rem, 5vw, 2.5rem);
  }
}
</style>