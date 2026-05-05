// Manages movies (still from mockData), reviews, watchlist and media likes.
// Reviews, watchlist and likes now talk to the real backend API.
// Movies stay in mockData because we have no TMDB/movie API set up yet.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockMovies } from '../data/mockData'

const API = 'http://localhost:3000/api'

export const useMediaStore = defineStore('media', () => {

  // ── State
  const movies    = ref([...mockMovies])   // still from mockData
  const reviews   = ref([])               // loaded from backend
  const watchlist = ref([])               // array of media_id numbers
  const likedMedia = ref([])              // array of media_id numbers

  // ── Computed 
  const trending = computed(() =>
    [...movies.value].sort((a, b) => b.rating - a.rating).slice(0, 6)
  )

  // ── Movie helpers (still local — no backend needed)
  function getMovieById(id) {
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
      // Merge into the reviews array (replace any existing ones for this mediaId)
      reviews.value = [
        ...reviews.value.filter(r => r.mediaId !== Number(mediaId)),
        ...data.reviews,
      ]
    } catch (err) {
      console.error('fetchReviewsByMediaId error:', err)
    }
  }

  // Load all reviews written by a specific user
  async function fetchReviewsByUserId(userId) {
    try {
      const res  = await fetch(`${API}/reviews?userId=${userId}`)
      const data = await res.json()
      reviews.value = [
        ...reviews.value.filter(r => r.userId !== Number(userId)),
        ...data.reviews,
      ]
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      const res  = await fetch(`${API}/watchlist/${userId}`)
      const data = await res.json()
      watchlist.value = data.watchlist   // array of media_id numbers
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, mediaId }),
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
    movies, reviews, watchlist, likedMedia, trending,
    getMovieById, searchMedia,
    fetchReviewsByMediaId, fetchReviewsByUserId,
    getReviewsByMediaId, getReviewsByUserId,
    addReview, updateReview, deleteReview, toggleReviewLike,
    fetchWatchlist, isInWatchlist, toggleWatchlist, getWatchlistMovies,
    isLiked, toggleLike,
  }
})
