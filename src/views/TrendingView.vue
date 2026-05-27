<template>
  <div class="trending-page bg-black text-light">

    <!-- HERO -->
    <section class="trending-hero position-relative overflow-hidden">

      <!-- BACKGROUND -->
      <img
        src="https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1400&q=80"
        alt="Cinema Background"
        class="hero-img position-absolute top-0 start-0 w-100 h-100"
      />

      <!-- OVERLAY -->
      <div class="hero-overlay position-absolute top-0 start-0 w-100 h-100"></div>

      <!-- CONTENT -->
      <div class="container position-relative z-2 py-5 text-center">

        <div class="hero-line mx-auto mb-5"></div>

        <p class="cl-accent fs-4 mb-3 fw-semibold">
          Popularity
        </p>

        <h1 class="cl-display display-title mb-4">
          Most Popular <span class="cl-accent">Movies</span>
        </h1>

        <p class="lead text-light opacity-75 mx-auto mb-5 hero-description">
          Explore the most popular movies that people are talking about.
        </p>

        <!-- SORT PANEL -->
        <div
          class="sort-panel d-inline-flex align-items-center gap-3 p-3 rounded-4"
        >

          <span class="fw-bold fs-5">
            Sort by
          </span>

          <!-- SELECT -->
          <div class="position-relative">

            <select
              v-model="sortBy"
              class="form-select sort-dropdown"
            >
              <option value="rating">
                IMDb rating
              </option>

              <option value="reviewCount">
                Review count
              </option>
            </select>

          </div>

          <!-- TOGGLE -->
          <button
            class="btn sort-toggle"
            @click="toggleSortOrder"
          >
            {{ sortOrder === 'desc' ? '⇩' : '⇧' }}
          </button>

        </div>

      </div>
    </section>

    <!-- MOVIES -->
    <section class="py-5">

      <div class="container">

        <div class="d-flex flex-column gap-4">

          <div
            v-for="(media, index) in sortedMovies"
            :key="media.id"
            class="movie-card card bg-dark border-secondary text-light shadow-lg position-relative overflow-hidden"
          >

            <!-- RANK -->
            <div class="rank-badge">
              {{ index + 1 }}
            </div>

            <div class="row g-0">

              <!-- POSTER -->
              <div class="col-md-3">

                <img
                  :src="media.poster"
                  :alt="media.title"
                  class="img-fluid h-100 object-fit-cover movie-poster"
                />

              </div>

              <!-- CONTENT -->
              <div class="col-md-9">

                <div class="card-body p-4 d-flex flex-column h-100">

                  <!-- HEADER -->
                  <div
                    class="d-flex justify-content-between align-items-start mb-3"
                  >

                    <div>

                      <h2 class="h3 fw-bold mb-2">
                        {{ media.title }}
                      </h2>

                      <p class="text-secondary mb-0">
                        {{ media.year }} ·
                        {{ (media.genre || []).join(', ') }}
                      </p>

                    </div>

                    <span class="badge bg-warning text-dark px-3 py-2">
                      {{ media.type === 'tv' ? 'TV' : 'Film' }}
                    </span>

                  </div>

                  <!-- SYNOPSIS -->
                  <p class="flex-grow-1 movie-synopsis">
                    {{ media.synopsis }}
                  </p>

                  <!-- STATS -->
                  <div class="d-flex flex-wrap gap-2 mb-4">

                    <span class="badge bg-secondary px-3 py-2 fs-6">
                      ★ {{ (media.combinedRating || 0).toFixed(1) }}
                    </span>

                    <span class="badge bg-secondary px-3 py-2 fs-6">
                      ✍ {{ media.reviewCount || 0 }} reviews
                    </span>

                  </div>

                  <!-- BUTTON -->
                  <RouterLink
                    :to="{
                      name: 'MediaDetail',
                      params: { id: media.id },
                      query: { type: media.type }
                    }"
                    class="btn btn-outline-warning align-self-start"
                  >
                    View details
                  </RouterLink>

                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>

  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onMounted
} from 'vue'

import { useMediaStore } from '../stores/media'

const mediaStore = useMediaStore()

const sortBy = ref('rating')
const sortOrder = ref('desc')

const activeTab = ref('all')
const currentPage = ref(1)
const totalPages = ref(1)

/* LOAD */
async function load() {

  const pages = await mediaStore.loadPopular(
    activeTab.value,
    currentPage.value
  )

  if (pages) {
    totalPages.value = pages
  }
}

onMounted(() => {
  load()
})

watch(activeTab, () => {
  currentPage.value = 1
  load()
})

watch(currentPage, () => {
  load()
})

/* NORMALIZE */
const normalizedMovies = computed(() => {

  return (mediaStore.movies || []).map(m => ({
    ...m,

    type:
      m.type ||
      m.media_type ||
      'movie',

    rating:
      m.rating ||
      m.vote_average ||
      0,

    reviewCount:
      m.reviewCount ||
      0,

    reviewAverage:
      m.reviewAverage ||
      0,

    combinedRating:
      m.reviewAverage
        ? ((m.rating || 0) * 0.7 + m.reviewAverage * 0.3)
        : (m.rating || 0)
  }))
})

/* SORT */
const sortedMovies = computed(() => {

  const list = [...normalizedMovies.value]

  const order =
    sortOrder.value === 'asc'
      ? 1
      : -1

  return list.sort((a, b) => {

    if (sortBy.value === 'reviewCount') {

      return order * (
        (a.reviewCount || 0) -
        (b.reviewCount || 0)
      )
    }

    return order * (
      (a.combinedRating || 0) -
      (b.combinedRating || 0)
    )
  })
})

/* TOGGLE */
function toggleSortOrder() {

  sortOrder.value =
    sortOrder.value === 'desc'
      ? 'asc'
      : 'desc'
}
</script>

<style scoped>

/* HERO */

.trending-hero {
  min-height: 650px;
  display: flex;
  align-items: center;
}

.hero-img {
  object-fit: cover;
}

.hero-overlay {
  background:
    linear-gradient(
      to bottom,
      rgba(0,0,0,0.65),
      rgba(0,0,0,0.92)
    );
}

.hero-line {
  width: 120px;
  height: 5px;
  background: var(--cl-accent);
  border-radius: 999px;
}

.hero-description {
  max-width: 700px;
}

/* TITLE */

.display-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
}

/* SORT PANEL */

.sort-panel {

  background:
    rgba(15,15,15,0.7);

  backdrop-filter: blur(12px);

  border:
    1px solid rgba(255,255,255,0.08);
}

/* DROPDOWN */

.sort-dropdown {

  width: 220px;

  background:
    rgba(20,20,20,0.95) !important;

  color: white !important;

  border:
    1px solid rgba(255,255,255,0.12);

  border-radius: 12px;

  padding:
    0.75rem 2.5rem 0.75rem 1rem;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.sort-dropdown:focus {

  border-color: var(--cl-accent);

  box-shadow:
    0 0 0 0.2rem rgba(232,197,71,0.2);
}

/* OPTION FIX */

.sort-dropdown option {
  background: #1b1b1b;
  color: white;
}

/* TOGGLE BUTTON */

.sort-toggle {

  background:
    rgba(20,20,20,0.95);

  border:
    1px solid rgba(255,255,255,0.12);

  color: var(--cl-accent);

  width: 52px;
  height: 52px;

  border-radius: 12px;

  font-size: 1.2rem;
}

.sort-toggle:hover {

  border-color: var(--cl-accent);
  color: var(--cl-accent);
}

/* MOVIE CARD */

.movie-card {

  border-radius: 24px;

  transition:
    transform 0.25s ease,
    border-color 0.25s ease;
}

.movie-card:hover {

  transform: translateY(-4px);

  border-color:
    rgba(232,197,71,0.5) !important;
}

/* RANK BADGE */

.rank-badge {

  position: absolute;

  top: 16px;
  left: 16px;

  width: 42px;
  height: 42px;

  border-radius: 50%;

  background: var(--cl-accent);
  color: var(--cl-bg);

  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: 800;

  z-index: 3;
}

/* POSTER */

.movie-poster {

  min-height: 100%;
  object-fit: cover;
}

/* SYNOPSIS */

.movie-synopsis {

  line-height: 1.7;

  color:
    rgba(255,255,255,0.82);
}

/* MOBILE */

@media (max-width: 768px) {

  .sort-panel {

    width: 100%;

    flex-direction: column;
  }

  .sort-dropdown {
    width: 100%;
  }

  .movie-poster {
    max-height: 420px;
  }
}

</style>