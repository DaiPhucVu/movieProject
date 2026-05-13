<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero position-relative">
      <img :src="featured.backdrop" :alt="featured.title" class="w-100 hero-img" />
      <div class="hero-gradient position-absolute top-0 start-0 w-100 h-100"></div>
      <div class="container hero-content position-relative text-light py-5">
        <div class="d-flex align-items-center gap-3 mb-3">
          <span class="badge bg-warning text-dark">{{ featured.type === 'tv' ? 'TV Series' : 'Film' }}</span>
          <span class="fw-semibold">{{ featured.year }}</span>
        </div>
        <h1 class="display-4 fw-bold">{{ featured.title }}</h1>
        <p class="lead text-light" style="max-width: 600px;">{{ featured.synopsis }}</p>
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="text-warning fs-5">★</span>
          <span class="fw-semibold">{{ featured.rating }}</span>
          <span class="text-light">/10</span>
          <span class="text-light ms-2">{{ featured.reviewCount }} reviews</span>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <RouterLink :to="`/media/${featured.id}`" class="btn btn-primary">View Details</RouterLink>
          <button
            v-if="auth.isAuthenticated"
            class="btn btn-outline-light"
            @click="mediaStore.toggleWatchlist(featured.id)"
          >
            {{ mediaStore.isInWatchlist(featured.id) ? '✓ In Watchlist' : '+ Watchlist' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Trending Section -->
    <section class="section py-5">
      <div class="container">
        <h2 class="mb-4 text-light">Trending <span class="text-warning">Now</span></h2>
        <div class="row g-3">
          <div class="col-6 col-sm-4 col-md-3 col-lg-2" v-for="m in mediaStore.trending" :key="m.id">
            <MediaCard :media="m" />
          </div>
        </div>
        <div class="text-center mt-4">
          <RouterLink to="/trending" class="btn btn-outline-light">See all trending →</RouterLink>
        </div>
      </div>
    </section>

    <!-- Recent Reviews Section -->
    <section class="section py-5">
      <div class="container">
        <h2 class="mb-4 text-light">Latest <span class="text-warning">Reviews</span></h2>
        <div class="row g-3">
          <div class="col-12 col-md-6 col-lg-4" v-for="review in recentReviews" :key="review.id">
            <div class="bg-dark rounded p-3 h-100">
              <ReviewCard :review="review" />
              <div class="d-flex align-items-center mt-2 gap-2">
                <RouterLink
                  :to="`/media/${review.mediaId}`"
                  class="text-decoration-none text-light d-flex flex-column align-items-center"
                  style="width: 80px;"
                >
                  <img
                    :src="getMedia(review.mediaId)?.poster"
                    :alt="getMedia(review.mediaId)?.title"
                    class="img-fluid rounded"
                    style="height: 120px; object-fit: cover;"
                  />
                  <small class="text-muted text-center mt-1">{{ getMedia(review.mediaId)?.title }}</small>
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

const featured = computed(() => mediaStore.movies[1]) // Oppenheimer as hero
const recentReviews = computed(() => [...mediaStore.reviews].slice(0, 4))

function getMedia(id) {
  return mediaStore.getMovieById(id)
}
</script>

<style scoped>
/* Hero Section */
.hero {
  min-height: 70vh;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  position: relative;
}

.hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
}

.hero-gradient {
  background: linear-gradient(to top, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.4) 60%, transparent 100%);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
}

/* Section headings */
.section h2 {
  font-family: var(--font-display);
}

/* Dark mode overrides */
body, .home {
  background-color: #0a0a0f;
  color: #f5f5f5;
}

.text-light {
  color: #f5f5f5 !important;
}

.text-warning {
  color: #ffc107 !important;
}

.btn-outline-light {
  color: #f5f5f5;
  border-color: #f5f5f5;
}

.btn-outline-light:hover {
  background-color: #ffc107;
  color: #0a0a0f;
  border-color: #ffc107;
}

.bg-dark {
  background-color: #12121a !important;
}

.bg-dark .text-muted {
  color: #b0b0b0 !important;
}
</style>