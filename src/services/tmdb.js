const TOKEN    = import.meta.env.VITE_TMDB_TOKEN
const BASE_URL = 'https://api.themoviedb.org/3'
const IMG      = 'https://image.tmdb.org/t/p'

// Image size options from TMDB:
//   Posters:   w342 (card thumbnails)  w500 (detail page)
//   Backdrops: w1280 (hero / banner)
const POSTER_SM = `${IMG}/w342`
const POSTER_LG = `${IMG}/w500`
const BACKDROP  = `${IMG}/w1280`

// request to TMDB needs this Authorization header
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

// ── Genre ID → Name lookup table ──────────────────────────────────────────────
// List endpoints return genre_ids (numbers), not names.
// We map them here so components can display "Drama" instead of 18.
const GENRE_MAP = {
  28:'Action', 12:'Adventure', 16:'Animation', 35:'Comedy',
  80:'Crime', 99:'Documentary', 18:'Drama', 10751:'Family',
  14:'Fantasy', 36:'History', 27:'Horror', 10402:'Music',
  9648:'Mystery', 10749:'Romance', 878:'Sci-Fi', 53:'Thriller',
  10752:'War', 37:'Western',
  // TV-only genres
  10759:'Action & Adventure', 10762:'Kids', 10763:'News',
  10764:'Reality', 10765:'Sci-Fi & Fantasy', 10766:'Soap',
  10767:'Talk', 10768:'War & Politics',
}

// low-level helper
// All functions below use this instead of calling fetch() directly.
// It adds the auth header and handles errors in one place.
async function get(endpoint, params = {}) {
  const query = new URLSearchParams(params).toString()
  const url   = `${BASE_URL}${endpoint}${query ? '?' + query : ''}`

  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`)
  return res.json()
}

// Shape converters 
// These convert TMDB's raw objects into the shape your components expect.
// As long as these return { id, title, type, year, genre, rating, poster,
// backdrop, synopsis, likes, reviewCount, director, cast, duration }


function shapeTV(item) {
  return {
    id:          item.id,
    title:       item.name,
    type:        'tv',
    year:        item.first_air_date ? Number(item.first_air_date.slice(0, 4)) : null,
    genre:       (item.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean),
    rating:      Math.round(item.vote_average * 10) / 10,
    poster:      item.poster_path   ? `${POSTER_SM}${item.poster_path}`   : '/no-poster.png',
    backdrop:    item.backdrop_path ? `${BACKDROP}${item.backdrop_path}`   : '',
    synopsis:    item.overview || '',
    likes:       item.vote_count || 0,
    reviewCount: 0,
    director: '', cast: [], duration: '',
  }
}

function shapeMovie(item) {
  return {
    id:          item.id,
    title:       item.title,
    type:        'movie',
    year:        item.release_date ? Number(item.release_date.slice(0, 4)) : null,
    genre:       (item.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean),
    rating:      Math.round(item.vote_average * 10) / 10,
    poster:      item.poster_path   ? `${POSTER_SM}${item.poster_path}`   : '/no-poster.png',
    backdrop:    item.backdrop_path ? `${BACKDROP}${item.backdrop_path}`   : '',
    synopsis:    item.overview || '',
    likes:       item.vote_count || 0,
    reviewCount: 0,   // comes from your own backend
    director: '', cast: [], duration: '',
  }
}


// Import and call these from your Pinia store (stores/media.js)
// Used by: HomeView trending strip
// Returns top trending movies + TV this week combined
export async function fetchTrending() {
  const data = await get('/trending/all/week', { language: 'en-US' })
  return data.results.map(item =>
    item.media_type === 'tv' ? shapeTV(item) : shapeMovie(item)
  )
}

// Used by: TrendingView — Movies tab
export async function fetchPopularMovies(page = 1) {
  const data = await get('/movie/popular', { language: 'en-US', page })
  return {
    results:    data.results.map(shapeMovie),
    totalPages: Math.min(data.total_pages, 500),
  }
}

// Used by: TrendingView — TV tab
export async function fetchPopularTV(page = 1) {
  const data = await get('/tv/popular', { language: 'en-US', page })
  return {
    results:    data.results.map(shapeTV),
    totalPages: Math.min(data.total_pages, 500),
  }
}

// Used by: SearchView — when user types in the search box
export async function searchTMDB(query, page = 1) {
  if (!query.trim()) return { results: [], totalPages: 0 }
  const data = await get('/search/multi', {
    query, language: 'en-US', page, include_adult: false,
  })
  const filtered = data.results.filter(r =>
    r.media_type === 'movie' || r.media_type === 'tv'
  )
  return {
    results:    filtered.map(r => r.media_type === 'tv' ? shapeTV(r) : shapeMovie(r)),
    totalPages: Math.min(data.total_pages, 500),
  }
}

// Used by: SearchView — when user uses the genre/year/type filter dropdowns
// (without a text query, uses TMDB's /discover endpoint)
export async function discoverMedia(filters = {}, page = 1) {
  const isTV     = filters.type === 'tv'
  const endpoint = isTV ? '/discover/tv' : '/discover/movie'

  // Convert genre name → TMDB genre ID
  const genreId = filters.genre
    ? Object.entries(GENRE_MAP).find(([, name]) => name === filters.genre)?.[0]
    : null

  const params = {
    language: 'en-US', page, include_adult: false,
    sort_by: 'popularity.desc',
    ...(genreId && { with_genres: genreId }),
    ...(filters.year && isTV  && { first_air_date_year: filters.year }),
    ...(filters.year && !isTV && { primary_release_year: filters.year }),
    ...(filters.minRating && { 'vote_average.gte': filters.minRating }),
  }

  const data = await get(endpoint, params)
  return {
    results:    data.results.map(isTV ? shapeTV : shapeMovie),
    totalPages: Math.min(data.total_pages, 500),
  }
}

// Used by: MediaDetailView — loads full cast, director, runtime
// append_to_response=credits fetches cast+crew in one single request
export async function fetchDetail(id, type = 'movie') {
  const endpoint = type === 'tv' ? `/tv/${id}` : `/movie/${id}`
  const data = await get(endpoint, {
    language: 'en-US',
    append_to_response: 'credits',
  })

  const crew     = data.credits?.crew || []
  const director = type === 'movie'
    ? (crew.find(p => p.job === 'Director')?.name || 'N/A')
    : (data.created_by?.[0]?.name || 'N/A')

  const cast = (data.credits?.cast || []).slice(0, 4).map(p => p.name)

  let duration = 'N/A'
  if (type === 'movie' && data.runtime) {
    duration = `${data.runtime} min`
  } else if (type === 'tv' && data.number_of_seasons) {
    const s = data.number_of_seasons
    duration = `${s} Season${s !== 1 ? 's' : ''}`
  }

  return {
    id:          data.id,
    title:       data.title || data.name,
    type,
    year:        Number((type === 'movie' ? data.release_date : data.first_air_date)?.slice(0, 4)),
    genre:       (data.genres || []).map(g => g.name),
    rating:      Math.round(data.vote_average * 10) / 10,
    poster:      data.poster_path   ? `${POSTER_LG}${data.poster_path}`   : '/no-poster.png',
    backdrop:    data.backdrop_path ? `${BACKDROP}${data.backdrop_path}`   : '',
    synopsis:    data.overview || '',
    likes:       data.vote_count || 0,
    reviewCount: 0,
    director, 
    cast, 
    duration,
  }
}