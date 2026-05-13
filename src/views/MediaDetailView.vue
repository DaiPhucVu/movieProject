<template>
  <!-- Loaded media -->
  <div v-if="media" class="media-detail">
    <!-- Backdrop hero -->
    <section class="hero position-relative">
      <img :src="media.backdrop" :alt="media.title" class="w-100 hero-img" />
      <div class="hero-gradient position-absolute top-0 start-0 w-100 h-100"></div>
    </section>

    <!-- Main info: poster + details -->
    <section class="info-section position-relative">
      <div class="container">
        <div class="row g-4 g-lg-5">
          <!-- Poster column -->
          <div class="col-12 col-md-5 col-lg-4">
            <div class="poster-wrap rounded shadow-lg">
              <img :src="media.poster" :alt="media.title" class="poster-img w-100" />
            </div>

            <!-- Action buttons -->
            <div class="d-flex flex-column gap-2 mt-3">
              <template v-if="auth.isAuthenticated">
                <button
                  class="btn btn-primary w-100"
                  @click="mediaStore.toggleWatchlist(media.id, auth.user.id)"
                >
                  {{ inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist' }}
                </button>
                <RouterLink
                  v-if="!hasUserReviewed"
                  :to="`/review/new/${media.id}`"
                  class="btn btn-outline-light w-100"
                >✍ Write a Review</RouterLink>
                <RouterLink
                  v-else
                  :to="`/review/edit/${userReview.id}`"
                  class="btn btn-outline-light w-100"
                >✍ Edit Your Review</RouterLink>
              </template>
              <template v-else>
                <RouterLink
                  :to="`/login?redirect=/media/${media.id}`"
                  class="btn btn-primary w-100"
                >Sign in to interact</RouterLink>
              </template>
            </div>
          </div>

          <!-- Details column -->
          <div class="col-12 col-md-7 col-lg-8 text-light">
            <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
              <span class="badge bg-warning text-dark">
                {{ media.type === 'tv' ? 'TV Series' : 'Film' }}
              </span>
              <span class="text-muted">·</span>
              <span class="text-muted small">{{ media.year }}</span>
              <span class="text-muted">·</span>
              <span class="text-muted small">{{ media.duration }}</span>
            </div>

            <h1 class="display-4 fw-bold mb-3">{{ media.title }}</h1>

            <div class="d-flex align-items-center gap-3 flex-wrap mb-3">
              <div class="d-flex align-items-baseline gap-1">
                <span class="text-warning">★</span>
                <span class="fs-3 fw-bold text-warning">{{ averageRating }}</span>
                <span class="text-muted small">/10</span>
              </div>
              <span class="text-muted small">
                {{ reviews.length }} {{ reviews.length === 1 ? 'review' : 'reviews' }}
              </span>
              <span class="text-muted small">❤ {{ formatNum(media.likes) }}</span>
            </div>

            <div class="d-flex flex-wrap gap-2 mb-3">
              <span v-for="g in media.genre" :key="g" class="genre-tag">{{ g }}</span>
            </div>

            <p class="lead mb-4">{{ media.synopsis }}</p>

            <div class="credits border-top border-secondary pt-3">
              <div class="row g-2 py-2 border-bottom border-secondary">
                <div class="col-4 col-md-3 text-uppercase small text-muted credit-label">Director</div>
                <div class="col-8 col-md-9 small">{{ media.director }}</div>
              </div>
              <div class="row g-2 py-2 border-bottom border-secondary">
                <div class="col-4 col-md-3 text-uppercase small text-muted credit-label">Cast</div>
                <div class="col-8 col-md-9 small">{{ media.cast?.join(', ') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews section -->
    <section class="section py-5">
      <div class="container">
        <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
          <h2 class="text-light mb-0">Collective <span class="text-warning">Reviews</span></h2>
          <div v-if="reviews.length > 1" class="d-flex align-items-center gap-2">
            <label class="small text-muted text-uppercase" for="sort-reviews">Sort by</label>
            <select id="sort-reviews" v-model="sortBy" class="form-select form-select-sm bg-dark text-light border-secondary w-auto">
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="top">Highest Rated</option>
              <option value="liked">Most Liked</option>
            </select>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loadingReviews" class="text-center py-5 text-muted">
          <p class="mb-0">Loading reviews…</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="reviews.length === 0" class="bg-dark border border-secondary rounded p-5 text-center">
          <h3 class="h4 text-light mb-2">No reviews yet</h3>
          <p class="text-muted mb-4">Be the first to share your thoughts on {{ media.title }}.</p>
          <RouterLink
            v-if="auth.isAuthenticated"
            :to="`/review/new/${media.id}`"
            class="btn btn-primary"
          >Write the first review</RouterLink>
          <RouterLink
            v-else
            :to="`/login?redirect=/media/${media.id}`"
            class="btn btn-primary"
          >Sign in to review</RouterLink>
        </div>

        <!-- Review list (paginated) -->
        <div v-else>
          <div class="row g-3">
            <div v-for="r in pagedReviews" :key="r.id" class="col-12">
              <div class="bg-dark rounded p-3">
                <ReviewCard :review="r" @delete="handleDelete" />
              </div>
            </div>
          </div>

          <PaginationBar
            v-model:currentPage="currentPage"
            :totalPages="totalPages"
          />
        </div>
      </div>
    </section>
  </div>

  <!-- Not found state -->
  <div v-else class="container text-center py-5 text-light">
    <h1 class="display-1 text-warning fw-bold">404</h1>
    <p class="lead text-muted mb-4">We couldn't find that title.</p>
    <RouterLink to="/" class="btn btn-primary">Back to Home</RouterLink>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '../stores/media'
import { useAuthStore } from '../stores/auth'
import ReviewCard from '../components/ReviewCard.vue'
import PaginationBar from '../components/PaginationBar.vue'

const route = useRoute()
const mediaStore = useMediaStore()
const auth = useAuthStore()

const PAGE_SIZE = 5

const sortBy = ref('recent')
const currentPage = ref(1)
const loadingReviews = ref(true)

const mediaId = computed(() => Number(route.params.id))
const media = computed(() => mediaStore.getMovieById(mediaId.value))

const inWatchlist = computed(() =>
  media.value ? mediaStore.isInWatchlist(media.value.id) : false
)

const reviews = computed(() => {
  if (!media.value) return []
  return mediaStore.getReviewsByMediaId(media.value.id)
})

const userReview = computed(() => {
  if (!auth.isAuthenticated) return null
  return reviews.value.find(r => r.userId === auth.user.id) || null
})
const hasUserReviewed = computed(() => userReview.value !== null)

const averageRating = computed(() => {
  if (reviews.value.length === 0) return media.value?.rating?.toFixed(1) ?? '–'
  const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
  return (sum / reviews.value.length).toFixed(1)
})

const sortedReviews = computed(() => {
  const list = [...reviews.value]
  switch (sortBy.value) {
    case 'oldest':
      return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    case 'top':
      return list.sort((a, b) => b.rating - a.rating)
    case 'liked':
      return list.sort((a, b) => b.likes - a.likes)
    case 'recent':
    default:
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedReviews.value.length / PAGE_SIZE))
)

const pagedReviews = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedReviews.value.slice(start, start + PAGE_SIZE)
})

watch([sortBy, mediaId], () => { currentPage.value = 1 })
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal
})

// ── Data loading ───────────────────────────────────────────────────────────
async function loadReviews() {
  if (!media.value) return
  loadingReviews.value = true
  await mediaStore.fetchReviewsByMediaId(media.value.id)
  loadingReviews.value = false
}

onMounted(loadReviews)
watch(mediaId, loadReviews)

// ── Actions ───────────────────────────────────────────────────────────────
async function handleDelete(reviewId) {
  if (!auth.user?.id) return
  if (!confirm('Delete this review? This cannot be undone.')) return
  const result = await mediaStore.deleteReview(reviewId, auth.user.id)
  if (!result?.success) {
    alert(result?.error || 'Could not delete review. Please try again.')
  }
}

function formatNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n
}
</script>

<style scoped>
/* Only styles Bootstrap can't do — hero gradient, poster aspect ratio, genre tags */

.hero {
  height: 50vh;
  min-height: 320px;
  max-height: 520px;
  overflow: hidden;
}
.hero-img {
  height: 100%;
  object-fit: cover;
  opacity: 0.4;
}
.hero-gradient {
  background: linear-gradient(to top, #000 0%, rgba(0,0,0,0.55) 50%, transparent 100%);
  pointer-events: none;
}

.info-section {
  margin-top: -180px;
  z-index: 1;
  padding-bottom: 60px;
}

.poster-wrap {
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}
.poster-img {
  height: 100%;
  object-fit: cover;
  display: block;
}

.genre-tag {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 100px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: #a8a8b3;
}

.credit-label {
  letter-spacing: 0.08em;
  padding-top: 2px;
}

/* Responsive overlap adjustments */
@media (max-width: 991.98px) {
  .info-section { margin-top: -120px; }
}
@media (max-width: 767.98px) {
  .hero { height: 36vh; min-height: 220px; }
  .info-section { margin-top: -80px; }
}
@media (max-width: 575.98px) {
  .hero { height: 28vh; min-height: 180px; }
  .info-section { margin-top: -60px; padding-bottom: 40px; }
}
</style>