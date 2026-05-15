// stores/media.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import {
  fetchTrending,
  fetchPopularMovies,
  fetchPopularTV,
  searchTMDB,
  discoverMedia,
  fetchDetail,
} from '../services/tmdb'

const API = 'http://localhost:3000/api'

export const useMediaStore = defineStore('media', () => {

  const auth = useAuthStore()

  //  STATE 
  const movies      = ref([])
  const detailCache = ref({})
  const reviews     = ref([])
  const loading     = ref(false)
  const error       = ref('')

  const likedMedia = ref(
    JSON.parse(localStorage.getItem('cinelog_liked')) || []
  )

  const watchlist = ref(
    JSON.parse(localStorage.getItem('cinelog_watchlist')) || []
  )

  //  COMPUTED 
  const trending = computed(() =>
    [...movies.value]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6)
  )

  function authHeaders() {
    return auth.token
      ? { Authorization: `Bearer ${auth.token}` }
      : {}
  }

  //  LOADERS 
  async function loadTrending() {
    loading.value = true
    error.value = ''
    try {
      movies.value = await fetchTrending()
    } catch (e) {
      error.value = 'Failed to load trending titles.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function loadPopular(type = 'all', page = 1) {
    loading.value = true
    error.value = ''
    try {
      if (type === 'movie') {
        const data = await fetchPopularMovies(page)
        movies.value = data.results
        return data.totalPages
      }

      if (type === 'tv') {
        const data = await fetchPopularTV(page)
        movies.value = data.results
        return data.totalPages
      }

      const [mv, tv] = await Promise.all([
        fetchPopularMovies(page),
        fetchPopularTV(page),
      ])

      movies.value = [...mv.results, ...tv.results]
        .sort((a, b) => b.rating - a.rating)

      return Math.max(mv.totalPages, tv.totalPages)

    } catch (e) {
      error.value = 'Failed to load titles.'
      console.error(e)
      return 0
    } finally {
      loading.value = false
    }
  }

  async function search(query = '', filters = {}, page = 1) {
    loading.value = true
    error.value = ''
    try {
      const data = query.trim()
        ? await searchTMDB(query, page)
        : await discoverMedia(filters, page)

      movies.value = data.results
      return data.totalPages
    } catch (e) {
      error.value = 'Search failed. Please try again.'
      console.error(e)
      return 0
    } finally {
      loading.value = false
    }
  }

  async function loadDetail(id, type = 'movie') {
    const key = `${type}-${id}`

    if (detailCache.value[key]) {
      return detailCache.value[key]
    }

    loading.value = true
    error.value = ''

    try {
      const detail = await fetchDetail(id, type)
      detailCache.value[key] = detail
      return detail
    } catch (e) {
      error.value = 'Failed to load title details.'
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  //  HELPERS 
  function getMovieById(id) {
    const cached = Object.values(detailCache.value)
      .find(d => d.id === Number(id))

    if (cached) return cached

    return movies.value.find(m => m.id === Number(id))
  }

  //  REVIEWS 
  async function fetchReviewsByMediaId(mediaId) {
    try {
      const res = await fetch(`${API}/reviews?mediaId=${mediaId}`)
      const data = await res.json()

      if (res.ok) {
        reviews.value = [
          ...reviews.value.filter(r => r.mediaId !== Number(mediaId)),
          ...data.reviews,
        ]
      }
    } catch (err) {
      console.error(err)
    }
  }

  function getReviewsByMediaId(mediaId) {
    return reviews.value.filter(
      r => Number(r.mediaId) === Number(mediaId)
    )
  }

  async function addReview(reviewData) {
    try {
      const res = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(reviewData),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      reviews.value.unshift(data.review)

      const movie = movies.value.find(
        m => m.id === Number(reviewData.mediaId)
      )

      if (movie) movie.reviewCount++

      return { success: true, review: data.review }

    } catch (err) {
      return { success: false, error: 'Server error' }
    }
  }

  //  WATCHLIST 

  function isInWatchlist(mediaId) {
    return watchlist.value.some(
      item => Number(item.mediaId) === Number(mediaId)
    )
  }

  async function fetchWatchlist(userId) {
    try {
      const res = await fetch(`${API}/watchlist/${userId}`, {
        headers: { ...authHeaders() }
      })

      const data = await res.json()

      if (res.ok && Array.isArray(data.watchlist)) {
        watchlist.value = data.watchlist.map(item => ({
          mediaId: Number(item.mediaId ?? item.id),
          type: item.type || 'movie'
        }))
      }

    } catch (err) {
      console.error(err)
    }
  }

  async function toggleWatchlist(mediaId, mediaType = 'movie') {
    try {
      const res = await fetch(`${API}/watchlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ mediaId })
      })

      const data = await res.json()

      if (data.saved) {
        if (!isInWatchlist(mediaId)) {
          watchlist.value.push({
            mediaId: Number(mediaId),
            type: mediaType
          })
        }
      } else {
        watchlist.value = watchlist.value.filter(
          item => Number(item.mediaId) !== Number(mediaId)
        )
      }

      localStorage.setItem(
        'cinelog_watchlist',
        JSON.stringify(watchlist.value)
      )

    } catch (err) {
      console.error(err)
    }
  }

  function getWatchlistItems() {
    return watchlist.value
  }

  //  LIKES 
  function isLiked(mediaId) {
    return likedMedia.value.includes(Number(mediaId))
  }

  function toggleLike(mediaId) {
    const id = Number(mediaId)
    const idx = likedMedia.value.indexOf(id)

    const movie = movies.value.find(m => m.id === id)

    if (idx === -1) {
      likedMedia.value.push(id)
      if (movie) movie.likes++
    } else {
      likedMedia.value.splice(idx, 1)
      if (movie) movie.likes--
    }

    localStorage.setItem(
      'cinelog_liked',
      JSON.stringify(likedMedia.value)
    )
  }

  //  EXPOSE 
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

    fetchReviewsByMediaId,
    addReview,
    getReviewsByMediaId,

    fetchWatchlist,
    toggleWatchlist,
    isInWatchlist,
    getWatchlistItems,

    isLiked,
    toggleLike,
  }
})