<template>
  <div class="home">

    <!--  Hero Section 
      v-if="featured" prevents crash while TMDB is still loading.
      featured is null/undefined until loadTrending() finishes and
      movies.value[0] exists — without this guard Vue throws an error
      trying to read .backdrop on undefined.
    -->
    <section v-if="featured" class="hero position-relative">
      <img
        :src="featured.backdrop"
        :alt="featured.title"
        class="w-100 hero-img"
      />
      <div class="hero-gradient position-absolute top-0 start-0 w-100 h-100"></div>
      <div class="container hero-content position-relative text-light py-5">
        <div class="d-flex align-items-center gap-3 mb-3">
          <span class="badge bg-warning text-dark">
            {{ featured.type === 'tv' ? 'TV Series' : 'Film' }}
          </span>
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
          <RouterLink
            :to="{ name: 'MediaDetail', params: { id: featured.id }, query: { type: featured.type } }"
            class="btn btn-primary"
          >
            View Details
          </RouterLink>
          <!-- Include type in watchlist check — TMDB ids overlap between movie and tv. -->
          <button
            v-if="auth.isAuthenticated"
            class="btn btn-outline-light"
            @click="mediaStore.toggleWatchlist(featured.id, featured.type)"
          >
            {{ mediaStore.isInWatchlist(featured.id, featured.type) ? '✓ In Watchlist' : '+ Watchlist' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Hero skeleton shown while TMDB loads — keeps layout stable -->
    <section v-else class="hero position-relative hero-skeleton">
      <div class="container hero-content position-relative text-light py-5">
        <p class="text-muted">Loading featured title...</p>
      </div>
    </section>

    <!-- Trending Section 
      Three states:
        1. v-if="mediaStore.loading"    → spinner while TMDB fetches
        2. v-else-if="mediaStore.error" → error message if fetch failed
        3. v-else                        → the actual card grid
    -->
    <section class="section py-5">
      <div class="container">
        <h2 class="mb-4 text-light">Trending <span class="text-warning">Now</span></h2>

        <!-- State 1: Loading spinner -->
        <div v-if="mediaStore.loading" class="text-center py-5">
          <div class="spinner-border text-warning" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Fetching trending titles...</p>
        </div>

        <!-- State 2: Error message (e.g. bad TMDB token or no internet) -->
        <div v-else-if="mediaStore.error" class="text-center py-5">
          <p class="text-danger">{{ mediaStore.error }}</p>
          <button class="btn btn-outline-warning mt-2" @click="mediaStore.loadTrending()">
            Try again
          </button>
        </div>

        <!-- State 3: Cards grid — only renders once TMDB data is ready -->
        <div v-else class="row g-3">
          <div
            v-for="m in mediaStore.trending"
            :key="m.id"
            class="col-6 col-sm-4 col-md-3 col-lg-2"
          >
            <MediaCard :media="m" />
          </div>
        </div>

        <div class="text-center mt-4">
          <RouterLink to="/trending" class="btn btn-outline-light">
            See all trending →
          </RouterLink>
        </div>
      </div>
    </section>

    <!--Recent Reviews Section 
      Reviews come from your own backend — unchanged.
      v-if="recentReviews.length" prevents rendering an empty section.
    -->
    <section v-if="recentReviews.length" class="section py-5">
      <div class="container">
        <h2 class="mb-4 text-light">Latest <span class="text-warning">Reviews</span></h2>
        <div class="row g-3">
          <div
            v-for="review in recentReviews"
            :key="review.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <div class="bg-dark rounded p-3 h-100">
              <ReviewCard :review="review" />
              <div class="d-flex align-items-center mt-2 gap-2">
                <RouterLink
                  :to="{ name: 'MediaDetail', params: { id: review.mediaId }, query: { type: getMedia(review.mediaId)?.type || 'movie' } }"
                  class="text-decoration-none text-light d-flex flex-column align-items-center"
                  style="width: 80px;"
                >
                  <img
                    :src="getMedia(review.mediaId)?.poster"
                    :alt="getMedia(review.mediaId)?.title"
                    class="img-fluid rounded"
                    style="height: 120px; object-fit: cover;"
                  />
                  <small class="text-muted text-center mt-1">
                    {{ getMedia(review.mediaId)?.title }}
                  </small>
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
import { computed, onMounted } from 'vue'        // combined — no duplicate imports
import { useMediaStore } from '../stores/media'  // only once
import { useAuthStore }  from '../stores/auth'
import MediaCard  from '../components/MediaCard.vue'
import ReviewCard from '../components/ReviewCard.vue'

const mediaStore = useMediaStore()
const auth       = useAuthStore()

// Fetch real TMDB trending data when the page loads
onMounted(() => {
  mediaStore.loadTrending()
})

// movies[0] is the first trending result — becomes the hero banner
// Will be undefined while loading, that's why the template uses v-if="featured"
const featured = computed(() => mediaStore.movies[0])

// Recent reviews still come from your own backend
const recentReviews = computed(() => [...mediaStore.reviews].slice(0, 4))

// Used by the reviews section to get the poster/title of the reviewed movie
function getMedia(id) {
  return mediaStore.getMovieById(id)
}
</script>

<style scoped>
/* Hero image fills the section */
.hero-img {
  height: 70vh;
  object-fit: cover;
  display: block;
}

/* Dark gradient over the hero image so text is readable */
.hero-gradient {
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.92) 0%,
    rgba(0, 0, 0, 0.4)  60%,
    transparent         100%
  );
}

/* Text sits at the bottom of the hero */
.hero-content {
  position: absolute !important;
  bottom: 0;
  left: 0;
  right: 0;
}

/* Placeholder height while hero is loading — prevents layout jump */
.hero-skeleton {
  height: 70vh;
  background: #12121a;
}
</style>