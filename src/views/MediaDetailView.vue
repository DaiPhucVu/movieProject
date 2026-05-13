<template>
  <div v-if="media" class="detail">
    <!-- Backdrop hero -->
    <section class="hero">
      <div class="hero-bg">
        <img :src="media.backdrop" :alt="media.title" />
        <div class="hero-gradient"></div>
      </div>
    </section>

    <!-- Main info: poster + details -->
    <section class="info-section">
      <div class="container">
        <div class="row g-4 g-lg-5">
          <!-- Poster column -->
          <div class="col-12 col-md-5 col-lg-4">
            <div class="poster-wrap">
              <img :src="media.poster" :alt="media.title" class="poster-img" />
            </div>

            <!-- Action buttons -->
            <div class="actions">
              <template v-if="auth.isAuthenticated">
                <button
                  class="btn btn-primary action-btn"
                  @click="mediaStore.toggleWatchlist(media.id, auth.user.id)"
                >
                  {{ inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist' }}
                </button>
                <RouterLink v-if="!hasUserReviewed" :to="`/review/new/${media.id}`" class="btn btn-ghost action-btn">
                  Write a Review
                </RouterLink>
                <RouterLink v-else :to="`/review/edit/${userReview.id}`" class="btn btn-ghost action-btn">
                  Edit Your Review
                </RouterLink>
              </template>
              <template v-else>
                <RouterLink :to="`/login?redirect=/media/${media.id}`" class="btn btn-primary action-btn">
                  Sign in to interact
                </RouterLink>
              </template>
            </div>
          </div>

          <!-- Details column -->
          <div class="col-12 col-md-7 col-lg-8">
            <div class="detail-meta">
              <span class="badge badge-type">{{ media.type === 'tv' ? 'TV Series' : 'Film' }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-text">{{ media.year }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-text">{{ media.duration }}</span>
            </div>

            <h1 class="detail-title">{{ media.title }}</h1>

            <div class="rating-row">
              <div class="rating-block">
                <span class="rating-star">★</span>
                <span class="rating-val">{{ averageRating }}</span>
                <span class="rating-sep">/10</span>
              </div>
              <span class="rating-count">{{ reviews.length }} {{ reviews.length === 1 ? 'review' : 'reviews' }}</span>
              <span class="rating-likes">❤ {{ formatNum(media.likes) }}</span>
            </div>

            <div class="genre-tags">
              <span v-for="g in media.genre" :key="g" class="genre-tag">{{ g }}</span>
            </div>

            <p class="synopsis">{{ media.synopsis }}</p>

            <div class="credit-row">
              <div class="credit-label">Director</div>
              <div class="credit-value">{{ media.director }}</div>
            </div>
            <div class="credit-row">
              <div class="credit-label">Cast</div>
              <div class="credit-value">{{ media.cast.join(', ') }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews section -->
    <section class="reviews-section">
      <div class="container">
        <div class="reviews-header">
          <h2 class="section-title">Collective <span>Reviews</span></h2>
          <div class="sort-control" v-if="reviews.length > 1">
            <label class="sort-label" for="sort-reviews">Sort by</label>
            <select id="sort-reviews" v-model="sortBy" class="sort-select">
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="top">Highest Rated</option>
              <option value="liked">Most Liked</option>
            </select>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loadingReviews" class="status-state">
          <p>Loading reviews…</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="reviews.length === 0" class="empty-state">
          <p class="empty-title">No reviews yet</p>
          <p class="empty-sub">Be the first to share your thoughts on {{ media.title }}.</p>
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
        <div v-else class="reviews-list">
          <div class="row g-3 g-md-4">
            <div v-for="r in pagedReviews" :key="r.id" class="col-12">
              <ReviewCard :review="r" @delete="handleDelete" />
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
  <div v-else class="not-found">
    <div class="container">
      <h1 class="nf-title">404</h1>
      <p class="nf-sub">We couldn't find that title.</p>
      <RouterLink to="/" class="btn btn-primary">Back to Home</RouterLink>
    </div>
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

// Use the store's helper — keeps things idiomatic and reactive
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

// Reset to page 1 whenever sort or media changes
watch([sortBy, mediaId], () => { currentPage.value = 1 })

// If reviews are deleted and current page is now beyond the last page, snap back
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
// Reload whenever the user navigates to a different /media/:id
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
/* ---------- Hero ---------- */
.hero { position: relative; height: 50vh; min-height: 320px; max-height: 520px; overflow: hidden; }
.hero-bg { position: absolute; inset: 0; }
.hero-bg img { width: 100%; height: 100%; object-fit: cover; opacity: 0.4; }
.hero-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(to top, var(--bg) 0%, rgba(10,10,15,0.55) 50%, transparent 100%);
}

/* ---------- Info section ---------- */
.info-section { margin-top: -180px; position: relative; z-index: 1; padding-bottom: 60px; }

.poster-wrap {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: 0 30px 60px rgba(0,0,0,0.6);
  aspect-ratio: 2 / 3;
}
.poster-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.actions { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
.action-btn { width: 100%; justify-content: center; }

/* ---------- Detail meta ---------- */
.detail-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.meta-dot { color: var(--text-dim); }
.meta-text { font-size: 0.85rem; color: var(--text-muted); }

.detail-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3.6rem);
  letter-spacing: 0.03em;
  line-height: 1;
  margin-bottom: 18px;
}

.rating-row { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin-bottom: 22px; }
.rating-block { display: flex; align-items: baseline; gap: 4px; }
.rating-star { color: var(--accent); font-size: 1rem; }
.rating-val { font-size: 1.6rem; font-weight: 600; color: var(--accent); }
.rating-sep { color: var(--text-dim); font-size: 0.95rem; }
.rating-count, .rating-likes { font-size: 0.85rem; color: var(--text-muted); }

.genre-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }
.genre-tag {
  font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em;
  padding: 4px 10px; border-radius: 100px;
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text-muted);
}

.synopsis {
  font-size: 0.98rem;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 28px;
  max-width: 65ch;
}

.credit-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  font-size: 0.88rem;
}
.credit-row:last-child { border-bottom: 1px solid var(--border); }
.credit-label { color: var(--text-dim); text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.08em; padding-top: 2px; }
.credit-value { color: var(--text-muted); line-height: 1.6; }

/* ---------- Reviews section ---------- */
.reviews-section { padding: 40px 0 80px; }

.reviews-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  flex-wrap: wrap; gap: 16px; margin-bottom: 28px;
}

.sort-control { display: flex; align-items: center; gap: 10px; }
.sort-label {
  font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text-dim);
}
.sort-select {
  background: var(--surface); color: var(--text);
  border: 1px solid var(--border); border-radius: 6px;
  padding: 7px 12px; font-size: 0.85rem; font-family: var(--font-body);
  cursor: pointer;
  transition: border-color var(--transition);
}
.sort-select:hover, .sort-select:focus { border-color: var(--border-hover); outline: none; }

.status-state {
  text-align: center; padding: 60px 20px;
  color: var(--text-muted); font-size: 0.92rem;
}

.empty-state {
  text-align: center; padding: 60px 20px;
  background: var(--surface); border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
}
.empty-title { font-family: var(--font-display); font-size: 1.4rem; letter-spacing: 0.03em; margin-bottom: 8px; }
.empty-sub { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 22px; }

.reviews-list { display: flex; flex-direction: column; gap: 24px; }

/* ---------- Not found ---------- */
.not-found { padding: 120px 0; text-align: center; }
.nf-title {
  font-family: var(--font-display);
  font-size: 6rem; letter-spacing: 0.05em;
  color: var(--accent); margin-bottom: 8px;
}
.nf-sub { font-size: 1rem; color: var(--text-muted); margin-bottom: 24px; }

/* ---------- Responsive ---------- */
@media (max-width: 991.98px) {
  .info-section { margin-top: -120px; }
}
@media (max-width: 767.98px) {
  .hero { height: 36vh; min-height: 220px; }
  .info-section { margin-top: -80px; }
  .credit-row { grid-template-columns: 1fr; gap: 4px; padding: 10px 0; }
  .reviews-header { flex-direction: column; align-items: stretch; }
  .sort-control { justify-content: space-between; }
}
@media (max-width: 575.98px) {
  .hero { height: 28vh; min-height: 180px; }
  .info-section { margin-top: -60px; padding-bottom: 40px; }
  .reviews-section { padding: 24px 0 60px; }
}
</style>