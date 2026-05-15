<template>
  <div v-if="media?.title" class="media-detail">

    <!-- Backdrop hero -->
    <section class="hero position-relative">
      <img
        :src="media.backdrop || ''"
        :alt="media.title || 'media'"
        class="w-100 hero-img"
      />
      <div class="hero-gradient position-absolute top-0 start-0 w-100 h-100"></div>
    </section>

    <!-- Main info -->
    <section class="info-section position-relative">
      <div class="container">
        <div class="row g-4 g-lg-5">

          <!-- Poster -->
          <div class="col-12 col-md-5 col-lg-4">
            <div class="poster-wrap cl-border">
              <img
                :src="media.poster || ''"
                :alt="media.title || 'poster'"
                class="poster-img w-100"
              />
            </div>

            <!-- Actions -->
            <div class="d-flex flex-column gap-2 mt-3">
              <template v-if="auth.isAuthenticated">

                <button
                  class="cl-btn cl-btn-primary w-100"
                  @click="mediaStore.toggleWatchlist(media.id, auth.user.id)"
                >
                  {{ inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist' }}
                </button>

                <RouterLink
                  v-if="!hasUserReviewed"
                  :to="`/review/new/${media.id}`"
                  class="cl-btn cl-btn-ghost w-100"
                >
                  ✍ Write a Review
                </RouterLink>

                <RouterLink
                  v-else
                  :to="`/review/edit/${userReview?.id}`"
                  class="cl-btn cl-btn-ghost w-100"
                >
                  ✍ Edit Your Review
                </RouterLink>

              </template>

              <template v-else>
                <RouterLink
                  :to="`/login?redirect=/media/${media.id}`"
                  class="cl-btn cl-btn-primary w-100"
                >
                  Sign in to interact
                </RouterLink>
              </template>
            </div>
          </div>

          <!-- Details -->
          <div class="col-12 col-md-7 col-lg-8">

            <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
              <span class="cl-badge cl-badge-accent">
                {{ media.type === 'tv' ? 'TV Series' : 'Film' }}
              </span>

              <span class="cl-dim">·</span>
              <span class="cl-muted small">{{ media.year || '—' }}</span>

              <span class="cl-dim">·</span>
              <span class="cl-muted small">{{ media.duration || '—' }}</span>
            </div>

            <h1 class="cl-display detail-title mb-3">
              {{ media.title }}
            </h1>

            <div class="d-flex align-items-center gap-3 flex-wrap mb-3">

              <div class="d-flex align-items-baseline gap-1">
                <span class="cl-accent">★</span>
                <span class="rating-value cl-accent">{{ averageRating || '–' }}</span>
                <span class="cl-dim small">/10</span>
              </div>

              <span class="cl-muted small">
                {{ reviews?.length || 0 }}
                {{ (reviews?.length || 0) === 1 ? 'review' : 'reviews' }}
              </span>

              <span class="cl-muted small">
                ❤ {{ formatNum(media.likes || 0) }}
              </span>

            </div>

            <div class="d-flex flex-wrap gap-2 mb-3">
              <span
                v-for="g in (media.genre || [])"
                :key="g"
                class="genre-tag"
              >
                {{ g }}
              </span>
            </div>

            <p class="synopsis mb-4">
              {{ media.synopsis || 'No description available.' }}
            </p>

            <div class="credits cl-border-t pt-3">

              <div class="row g-2 py-2 cl-border-b">
                <div class="col-4 col-md-3 cl-dim small credit-label">Director</div>
                <div class="col-8 col-md-9 cl-muted small">
                  {{ media.director || '—' }}
                </div>
              </div>

              <div class="row g-2 py-2 cl-border-b">
                <div class="col-4 col-md-3 cl-dim small credit-label">Cast</div>
                <div class="col-8 col-md-9 cl-muted small">
                  {{ media.cast?.join(', ') || '—' }}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>

    <!-- Reviews -->
    <section class="py-5">
      <div class="container">

        <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
          <h2 class="cl-display section-title mb-0">
            Collective <span class="cl-accent">Reviews</span>
          </h2>

          <div v-if="reviews?.length > 1" class="d-flex align-items-center gap-2">
            <label class="cl-dim small text-uppercase sort-label">
              Sort by
            </label>

            <select v-model="sortBy" class="cl-select cl-btn-sm">
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="top">Highest Rated</option>
              <option value="liked">Most Liked</option>
            </select>
          </div>
        </div>

        <div v-if="loadingReviews" class="text-center py-5 cl-muted">
          Loading reviews…
        </div>

        <div v-else-if="(reviews?.length || 0) === 0" class="empty-state cl-card p-5 text-center">
          <h3 class="cl-display h4 mb-2">No reviews yet</h3>
          <p class="cl-muted mb-4">
            Be the first to share your thoughts on {{ media.title }}.
          </p>
        </div>

        <div v-else>
          <div class="row g-3">
            <div v-for="r in pagedReviews" :key="r.id" class="col-12">
              <div class="cl-card p-3">
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

  <!-- fallback -->
  <div v-else class="container text-center py-5">
    <h1 class="cl-display nf-title cl-accent">Loading / Not Found</h1>
    <p class="cl-muted mb-4">We couldn't load this title.</p>
    <RouterLink to="/" class="cl-btn cl-btn-primary">
      Back to Home
    </RouterLink>
  </div>

</template>

<script setup>
console.log('MediaDetailView MOUNTED')
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '../stores/media'
import { useAuthStore } from '../stores/auth'
import ReviewCard from '../components/ReviewCard.vue'
import PaginationBar from '../components/PaginationBar.vue'
 
const route      = useRoute()
const mediaStore = useMediaStore()
const auth       = useAuthStore()
 
const PAGE_SIZE = 5
 
//  Local state 
const sortBy       = ref('recent')
const currentPage  = ref(1)
const loadingReviews = ref(false)
 
// This is separate from mediaStore.movies — it's the complete detail response
const media = ref(null)

//  Route params 
// id comes from /media/:id
// type comes from ?type=movie or ?type=tv — set in your RouterLink/router.push
const mediaId   = computed(() => Number(route.params.id))
const mediaType = computed(() =>
  route.query.type === 'tv' ? 'tv' : 'movie'
)
 
//  Watchlist / like state 
const inWatchlist = computed(() =>
  media.value ? mediaStore.isInWatchlist(media.value.id) : false
)
const isLiked = computed(() =>
  media.value ? mediaStore.isLiked(media.value.id) : false
)
 
//  Reviews 
// Reviews come from YOUR OWN backend — unchanged
const reviews = computed(() => {
  if (!media.value) return []
  return mediaStore.getReviewsByMediaId(media.value.id)
})
 
const userReview = computed(() => {
  if (!auth.isAuthenticated) return null
  return reviews.value.find(r => r.userId === auth.user.id) || null
})
 
const hasUserReviewed = computed(() => userReview.value !== null)
 
//  Average rating 
// Uses your own backend reviews if available, otherwise falls back to TMDB rating
const averageRating = computed(() => {
  if (reviews.value.length === 0) return media.value?.rating?.toFixed(1) ?? '–'
  const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
  return (sum / reviews.value.length).toFixed(1)
})
 
//  Sorted + paginated reviews 
const sortedReviews = computed(() => {
  const list = [...reviews.value]
  switch (sortBy.value) {
    case 'oldest': return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    case 'top':    return list.sort((a, b) => b.rating - a.rating)
    case 'liked':  return list.sort((a, b) => b.likes - a.likes)
    case 'recent':
    default:       return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
})
 
const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedReviews.value.length / PAGE_SIZE))
)
 
const pagedReviews = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedReviews.value.slice(start, start + PAGE_SIZE)
})
 
// Reset to page 1 when sort changes or navigating to a different media item
watch([sortBy, mediaId], () => { currentPage.value = 1 })
 
// Clamp page if total drops below current page
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal
})
 
// Data loading 
 
// mediaType comes from route.query.type — set when navigating to this page
// e.g. <RouterLink :to="{ name:'MediaDetail', params:{ id:m.id }, query:{ type:m.type } }">
//async function loadMedia() {
// media.value = await mediaStore.loadDetail(mediaId.value, mediaType.value)
//}

async function loadMedia() {
  console.log('Loading:', mediaId.value, mediaType.value)

  media.value = await mediaStore.loadDetail(
    mediaId.value,
    mediaType.value
  )

  console.log('Loaded media:', media.value)
}
 
// Loads reviews from YOUR OWN backend (unchanged)
async function loadReviews() {
  if (!media.value) return
  loadingReviews.value = true
  await mediaStore.fetchReviewsByMediaId(media.value.id)
  loadingReviews.value = false
}
 
// loadMedia() must finish first so media.value exists before loadReviews() runs
onMounted(async () => {
  await loadMedia()    // 1. fetch TMDB detail → fills media.value
  await loadReviews()  // 2. fetch your backend reviews → needs media.value.id
})
 
// Re-run both if user navigates directly from one media page to another
// e.g. clicking a related title without going back to the list first
watch(mediaId, async () => {
  media.value = null   // clear old data so template shows loading state
  await loadMedia()
  await loadReviews()
})
 
//  Actions 
 
function handleLike() {
  if (!auth.isAuthenticated || !media.value) return
  mediaStore.toggleLike(media.value.id)
}
 
function handleWatchlist() {
  if (!auth.isAuthenticated || !media.value) return
  mediaStore.toggleWatchlist(media.value.id)
}
 
async function handleDelete(reviewId) {
  if (!auth.user?.id) return
  if (!confirm('Delete this review? This cannot be undone.')) return
  const result = await mediaStore.deleteReview(reviewId, auth.user.id)
  if (!result?.success) {
    alert(result?.error || 'Could not delete review. Please try again.')
  }
}
 
//  Helpers 
function formatNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n
}
</script>

<style scoped>
/*  Hero  */
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
  background: linear-gradient(to top, var(--cl-bg) 0%, rgba(10,10,15,0.55) 50%, transparent 100%);
  pointer-events: none;
}

/* ---------- Info section ---------- */
.info-section {
  margin-top: -180px;
  z-index: 1;
  padding-bottom: 60px;
}

.poster-wrap {
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: var(--cl-radius-lg);
  box-shadow: 0 30px 60px rgba(0,0,0,0.6);
}
.poster-img {
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ---------- Detail meta ---------- */
.detail-title {
  font-size: clamp(2rem, 5vw, 3.6rem);
  letter-spacing: 0.03em;
  line-height: 1;
  color: var(--cl-text);
}

.rating-value {
  font-size: 1.6rem;
  font-weight: 600;
}

.genre-tag {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 100px;
  background: var(--cl-surface);
  border: 1px solid var(--cl-border);
  color: var(--cl-text-muted);
}

.synopsis {
  font-size: 0.98rem;
  line-height: 1.75;
  color: var(--cl-text);
  max-width: 65ch;
}

.credit-label {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.72rem;
  padding-top: 2px;
}

/* ---------- Reviews section ---------- */
.section-title {
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  color: var(--cl-text);
}

.sort-label {
  letter-spacing: 0.08em;
  font-size: 0.72rem;
}

.empty-state {
  border-style: dashed;
}

/* ---------- 404 ---------- */
.nf-title {
  font-size: 6rem;
  letter-spacing: 0.05em;
}

/* ---------- Responsive ---------- */
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