// Manages movies, reviews, watchlist, and backend data.
// Movies still start from mockData so the app works before the backend is loaded.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import {fetchTrending, fetchPopularMovies, fetchPopularTV, searchTMDB, discoverMedia, fetchDetail,} from '../services/tmdb'

const API = 'http://localhost:3000/api'

export const useMediaStore = defineStore('media', () => {

  // ── State
  const auth = useAuthStore()

  const movies    = ref([])
  const detailCache = ref({})
  const reviews   = ref([])
  const watchlist  = ref(JSON.parse(localStorage.getItem('cinelog_watchlist')) || [])
  const likedMedia = ref(JSON.parse(localStorage.getItem('cinelog_liked')) || [])
  const loading    = ref(false)
  const error      = ref('')

  // ── Computed 
  const trending = computed(() =>
    [...movies.value].sort((a, b) => b.rating - a.rating).slice(0, 6)
  )

  function authHeaders() {
    return auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
  }

  async function loadTrending() {
  loading.value = true
  error.value   = ''
  try {
    movies.value = await fetchTrending()
  } catch (e) {
    error.value = 'Failed to load trending titles.'
    console.error('loadTrending error:', e)
  } finally {
    loading.value = false
  }
  }

  async function loadPopular(type = 'all', page = 1) {
  loading.value = true
  error.value   = ''
  try {
    if (type === 'movie') {
      const data   = await fetchPopularMovies(page)
      movies.value = data.results
      return data.totalPages
    } else if (type === 'tv') {
      const data   = await fetchPopularTV(page)
      movies.value = data.results
      return data.totalPages
    } else {
      const [mv, tv] = await Promise.all([
        fetchPopularMovies(page),
        fetchPopularTV(page),
      ])
      movies.value = [...mv.results, ...tv.results].sort((a, b) => b.rating - a.rating)
      return Math.max(mv.totalPages, tv.totalPages)
    }
  } catch (e) {
    error.value = 'Failed to load titles.'
    console.error('loadPopular error:', e)
    return 0
  } finally {
    loading.value = false
  }
}

  async function search(query = '', filters = {}, page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const data = query.trim()
      ? await searchTMDB(query, page)
      : await discoverMedia(filters, page)
    movies.value = data.results
    return data.totalPages
  } catch (e) {
    error.value = 'Search failed. Please try again.'
    console.error('search error:', e)
    return 0
  } finally {
    loading.value = false
  }
  }

async function loadDetail(id, type = 'movie') {
  const cacheKey = `${type}-${id}`
  if (detailCache.value[cacheKey]) return detailCache.value[cacheKey]

  loading.value = true
  error.value   = ''
  try {
    const detail = await fetchDetail(id, type)
    detailCache.value[cacheKey] = detail
    return detail
  } catch (e) {
    error.value = 'Failed to load title details.'
    console.error('loadDetail error:', e)
    return null
  } finally {
    loading.value = false
  }
}

  // ── Movie helpers 
  function getMovieById(id) {
  // Check detail cache first — has full cast, director, duration
  const fromCache = Object.values(detailCache.value).find(d => d.id === Number(id))
  if (fromCache) return fromCache
  // Fall back to movies array (basic info only)
  return movies.value.find(m => m.id === Number(id))
}
  function searchMedia(query, filters = {}) {
    return movies.value.filter(m => {
      const matchQuery  = !query             || m.title.toLowerCase().includes(query.toLowerCase())
      const matchGenre  = !filters.genre     || m.genre.some(g => g.toLowerCase().includes(filters.genre.toLowerCase()))
      const matchType   = !filters.type      || m.type === filters.type
      const matchYear   = !filters.year      || m.year === Number(filters.year)
      const matchRating = !filters.minRating || m.rating >= Number(filters.minRating)
      return matchQuery && matchGenre && matchType && matchYear && matchRating
    })
  }

  // ── Reviews — backend-connected 

  // Load all reviews for a specific movie/show from the backend
  async function fetchReviewsByMediaId(mediaId) {
    try {
      const res  = await fetch(`${API}/reviews?mediaId=${mediaId}`)
      const data = await res.json()
      if (res.ok) {
        reviews.value = [
          ...reviews.value.filter(r => r.mediaId !== Number(mediaId)),
          ...data.reviews,
        ]
      }
    } catch (err) {
      console.error('fetchReviewsByMediaId error:', err)
    }
  }

  // Load all reviews written by a specific user
  async function fetchReviewsByUserId(userId) {
    try {
      const res  = await fetch(`${API}/reviews?userId=${userId}`)
      const data = await res.json()
      if (res.ok) {
        reviews.value = [
          ...reviews.value.filter(r => r.userId !== Number(userId)),
          ...data.reviews,
        ]
      }
    } catch (err) {
      console.error('fetchReviewsByUserId error:', err)
    }
  }

  // Return cached reviews for a media item (call fetchReviewsByMediaId first)
  function getReviewsByMediaId(mediaId) {
    return reviews.value.filter(r => r.mediaId === Number(mediaId))
  }

  // Return cached reviews for a user (call fetchReviewsByUserId first)
  function getReviewsByUserId(userId) {
    return reviews.value.filter(r => r.userId === Number(userId))
  }

  // Post a new review to the backend
  async function addReview(reviewData) {
    try {
      const res  = await fetch(`${API}/reviews`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(reviewData),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error }

      // Add the returned review (with user info) to local state
      reviews.value.unshift(data.review)

      // Bump the review count on the movie object
      const movie = movies.value.find(m => m.id === Number(reviewData.mediaId))
      if (movie) movie.reviewCount++

      return { success: true, review: data.review }
    } catch (err) {
      return { success: false, error: 'Cannot connect to server.' }
    }
  }

  // Update an existing review on the backend
  async function updateReview(reviewId, updateData) {
    try {
      const res  = await fetch(`${API}/reviews/${reviewId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(updateData),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error }

      // Replace the old review in local state
      const idx = reviews.value.findIndex(r => r.id === Number(reviewId))
      if (idx !== -1) reviews.value[idx] = data.review

      return { success: true }
    } catch (err) {
      return { success: false, error: 'Cannot connect to server.' }
    }
  }

  // Delete a review on the backend
  async function deleteReview(reviewId, userId) {
    try {
      const res  = await fetch(`${API}/reviews/${reviewId}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error }

      // Remove from local state
      const review = reviews.value.find(r => r.id === Number(reviewId))
      reviews.value = reviews.value.filter(r => r.id !== Number(reviewId))

      // Decrement the movie's review count
      if (review) {
        const movie = movies.value.find(m => m.id === review.mediaId)
        if (movie) movie.reviewCount--
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: 'Cannot connect to server.' }
    }
  }

  // Toggle a like on a review
  async function toggleReviewLike(reviewId, userId) {
    try {
      const res  = await fetch(`${API}/reviews/${reviewId}/like`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()

      // Update the review's liked state in local state
      const review = reviews.value.find(r => r.id === Number(reviewId))
      if (review) {
        review.liked  = data.liked
        review.likes += data.liked ? 1 : -1
      }
    } catch (err) {
      console.error('toggleReviewLike error:', err)
    }
  }

  // ── Watchlist — backend-connected ──────────────────────────────────────────

  // Load the user's watchlist from the backend
  async function fetchWatchlist(userId) {
    try {
      const res  = await fetch(`${API}/watchlist/${userId}`, {
        headers: { ...authHeaders() },
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.watchlist)) {
        watchlist.value = data.watchlist.map(item => item.id)
      }
    } catch (err) {
      console.error('fetchWatchlist error:', err)
    }
  }

  function isInWatchlist(mediaId) {
    return watchlist.value.includes(Number(mediaId))
  }

  async function toggleWatchlist(mediaId, userId) {
    try {
      const res  = await fetch(`${API}/watchlist/toggle`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ mediaId }),
      })
      const data = await res.json()

      // Update local state to match backend response
      if (data.saved) {
        watchlist.value.push(Number(mediaId))
      } else {
        watchlist.value = watchlist.value.filter(id => id !== Number(mediaId))
      }
    } catch (err) {
      console.error('toggleWatchlist error:', err)
    }
  }

  function getWatchlistMovies() {
    return movies.value.filter(m => watchlist.value.includes(m.id))
  }

  // ── Media likes (kept local for simplicity — easy to move to backend later) ─
  function isLiked(mediaId) {
    return likedMedia.value.includes(Number(mediaId))
  }

  function toggleLike(mediaId) {
    const id    = Number(mediaId)
    const idx   = likedMedia.value.indexOf(id)
    const movie = movies.value.find(m => m.id === id)
    if (idx === -1) {
      likedMedia.value.push(id)
      if (movie) movie.likes++
    } else {
      likedMedia.value.splice(idx, 1)
      if (movie) movie.likes--
    }
  }

  return {
    movies, 
    reviews, 
    watchlist, 
    likedMedia, 
    trending, 
    loading,
    error,
    loadTrending,
    loadPopular,
    search,
    loadDetail,
    getMovieById, 
    searchMedia,
    fetchReviewsByMediaId, 
    fetchReviewsByUserId,
    getReviewsByMediaId, 
    getReviewsByUserId,
    addReview, 
    updateReview, 
    deleteReview, 
    toggleReviewLike,
    fetchWatchlist, 
    isInWatchlist, 
    toggleWatchlist, 
    getWatchlistMovies,
    isLiked, 
    toggleLike,
  }
})
