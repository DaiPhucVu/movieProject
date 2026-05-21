import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

dotenv.config()
const app = express()
const prisma = new PrismaClient()
const port = process.env.PORT || 3000
const jwtSecret = process.env.JWT_SECRET || 'secret'

app.use(cors())
app.use(express.json())

function generateToken(user) {
  return jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' })
}

function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' })
  }

  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, jwtSecret)
    req.userId = payload.userId
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Soft variant of `authenticate`: if a valid token is supplied, set req.userId.
// If there's no token (or it's invalid), continue without an error so the
// route can still respond as if the viewer were a guest.
// Used by public endpoints that want to personalise the response when the
// viewer happens to be signed in (e.g. an `isFollowing` flag on a profile).
function attachUser(req, res, next) {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.split(' ')[1], jwtSecret)
      req.userId = payload.userId
    } catch (err) {
      // invalid token → treat as guest
    }
  }
  next()
}

// Shape a Prisma User row into the public profile shape the frontend uses.
// Strips out the password hash and email by default.
function publicUser(u) {
  return {
    id:          u.id,
    username:    u.username,
    displayName: u.displayName,
    avatar:      u.avatar || null,
    bio:         u.bio    || null,
  }
}

app.get('/', (req, res) => {
  res.json({ message: 'CineLOG backend is running' })
})

// ── Auth ───────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { username, email, displayName, password } = req.body
  if (!username || !email || !displayName || !password) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, email, displayName, password: hashedPassword },
    })

    const token = generateToken(user)
    return res.json({
      user: {
        id:          user.id,
        username:    user.username,
        displayName: user.displayName,
        email:       user.email,
        avatar:      user.avatar || null,
        bio:         user.bio    || null,
      },
      token,
    })
  } catch (err) {
    const message = err.code === 'P2002' ? 'Username or email already exists' : 'Unable to create account'
    return res.status(400).json({ error: message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' })
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: username }] },
  })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = generateToken(user)
  return res.json({
    user: {
      id:          user.id,
      username:    user.username,
      displayName: user.displayName,
      email:       user.email,
      avatar:      user.avatar || null,
      bio:         user.bio    || null,
    },
    token,
  })
})

// ── Reviews ────────────────────────────────────────────────────────
// mediaId is now a TMDB id; reviews are not linked to any local Media row.
app.get('/api/reviews', async (req, res) => {
  const mediaId = req.query.mediaId ? Number(req.query.mediaId) : undefined
  const reviews = await prisma.review.findMany({
    where: mediaId ? { mediaId } : {},
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ reviews })
})

app.post('/api/reviews', authenticate, async (req, res) => {
  const { mediaId, rating, content } = req.body
  if (!mediaId || !rating || !content) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const review = await prisma.review.create({
    data: {
      mediaId: Number(mediaId),
      rating,
      content,
      userId: req.userId,
    },
  })

  // Note: Media aggregation removed — movies come from TMDB, so we don't
  // maintain reviewCount/rating on the local Media table anymore.
  // If a page needs aggregated stats, it should compute them on the fly
  // from the Review table (see /api/reviews/stats/:mediaId below).

  res.status(201).json({ review })
})

app.delete('/api/reviews/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id)

  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) {
    return res.status(404).json({ error: 'Review not found' })
  }
  if (review.userId !== req.userId) {
    return res.status(403).json({ error: 'You can only delete your own reviews' })
  }

  await prisma.review.delete({ where: { id } })
  res.json({ success: true })
})

// Convenience endpoint for any frontend that wants aggregated review stats
// for a single (TMDB) movie. Computed live from the Review table.
app.get('/api/reviews/stats/:mediaId', async (req, res) => {
  const mediaId = Number(req.params.mediaId)
  const reviews = await prisma.review.findMany({ where: { mediaId } })

  if (reviews.length === 0) {
    return res.json({ mediaId, count: 0, averageRating: 0 })
  }

  const sum = reviews.reduce((total, r) => total + r.rating, 0)
  const averageRating = Number((sum / reviews.length).toFixed(1))

  res.json({ mediaId, count: reviews.length, averageRating })
})

// ── Watchlist ───
app.get('/api/watchlist/:userId', authenticate, async (req, res) => {
  const userId = Number(req.params.userId)
  if (req.userId !== userId) return res.status(403).json({ error: 'Unauthorized' })

  const items = await prisma.watchlist.findMany({
    where: { userId },
  })

  res.json({ watchlist: items })
})

app.post('/api/watchlist/toggle', authenticate, async (req, res) => {
  try {
    const { mediaId, type } = req.body

    if (!mediaId) {
      return res.status(400).json({ error: 'Missing mediaId' })
    }

    const existing = await prisma.watchlist.findFirst({
      where: {
        userId: req.userId,
        mediaId: Number(mediaId),
      },
    })

    if (existing) {
      await prisma.watchlist.delete({ where: { id: existing.id } })
      return res.json({ saved: false })
    }

    await prisma.watchlist.create({
      data: {
        userId: req.userId,
        mediaId: Number(mediaId),
        type: type || 'movie',
      },
    })

    return res.json({ saved: true })
  } catch (err) {
    console.error('WATCHLIST ERROR:', err)
    return res.status(500).json({ error: 'Failed to update watchlist' })
  }
})

// ── Users / Profiles ───────────────────────────────────────────────
// Public profile lookup by username.
// When called with a Bearer token, the response also includes `isFollowing`
// and `isSelf` flags so the frontend can render the right action button.
app.get('/api/users/:username', attachUser, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  // Aggregated counts displayed on the profile header
  const [reviewCount, watchlistCount, followersCount, followingCount] = await Promise.all([
    prisma.review.count({ where: { userId: user.id } }),
    prisma.watchlist.count({ where: { userId: user.id } }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ])

  // Only check the follow edge if the viewer is signed in and looking at
  // someone else's profile.
  let isFollowing = false
  let isSelf      = false
  if (req.userId) {
    isSelf = req.userId === user.id
    if (!isSelf) {
      const edge = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId:  req.userId,
            followingId: user.id,
          },
        },
      })
      isFollowing = !!edge
    }
  }

  res.json({
    user: {
      ...publicUser(user),
      createdAt: user.createdAt,
    },
    stats: {
      reviews:   reviewCount,
      watchlist: watchlistCount,
      followers: followersCount,
      following: followingCount,
    },
    isFollowing,
    isSelf,
  })
})

// Update the signed-in user's own profile (displayName / avatar / bio).
// Username and email are immutable for simplicity.
app.put('/api/users/me', authenticate, async (req, res) => {
  const { displayName, avatar, bio } = req.body
  const data = {}
  if (typeof displayName === 'string' && displayName.trim()) {
    data.displayName = displayName.trim().slice(0, 60)
  }
  if (typeof avatar === 'string') data.avatar = avatar.trim() || null
  if (typeof bio === 'string')    data.bio    = bio.slice(0, 300)

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' })
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data,
    })
    res.json({
      user: {
        id:          updated.id,
        username:    updated.username,
        displayName: updated.displayName,
        email:       updated.email,
        avatar:      updated.avatar || null,
        bio:         updated.bio    || null,
      },
    })
  } catch (err) {
    console.error('Profile update failed:', err)
    res.status(500).json({ error: 'Could not update profile' })
  }
})

// All reviews authored by `:username`, newest first.
// Includes the basic user info so the frontend doesn't need a second lookup.
app.get('/api/users/:username/reviews', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const reviews = await prisma.review.findMany({
    where:   { userId: user.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ reviews })
})

// Public watchlist for `:username`.
// Different from /api/watchlist/:userId which is private and uses numeric id;
// this one looks up by username and is intentionally public so other users
// can see what someone wants to watch.
app.get('/api/users/:username/watchlist', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const items = await prisma.watchlist.findMany({
    where:   { userId: user.id },
    orderBy: { id: 'desc' },
  })
  res.json({ watchlist: items })
})

// Helper used by /followers and /following — given a list of follow edges,
// resolve them into the matching user objects and decorate with
// `isFollowing` (from the signed-in viewer's perspective) when possible.
async function decorateFollows(users, viewerId) {
  if (!viewerId) return users.map(u => ({ ...publicUser(u), isFollowing: false }))

  const viewerEdges = await prisma.follow.findMany({
    where:  { followerId: viewerId, followingId: { in: users.map(u => u.id) } },
    select: { followingId: true },
  })
  const followingSet = new Set(viewerEdges.map(e => e.followingId))
  return users.map(u => ({
    ...publicUser(u),
    isFollowing: followingSet.has(u.id),
  }))
}

// List the users who follow `:username`.
app.get('/api/users/:username/followers', attachUser, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const edges = await prisma.follow.findMany({
    where:   { followingId: user.id },
    include: { follower: true },
    orderBy: { createdAt: 'desc' },
  })
  const followers = edges.map(e => e.follower)
  res.json({ users: await decorateFollows(followers, req.userId) })
})

// List the users `:username` follows.
app.get('/api/users/:username/following', attachUser, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const edges = await prisma.follow.findMany({
    where:   { followerId: user.id },
    include: { following: true },
    orderBy: { createdAt: 'desc' },
  })
  const following = edges.map(e => e.following)
  res.json({ users: await decorateFollows(following, req.userId) })
})

// Toggle follow on `:username`. The viewer must be signed in and can't
// follow themselves. Returns the new state so the UI can flip its button.
app.post('/api/users/:username/follow', authenticate, async (req, res) => {
  const target = await prisma.user.findUnique({
    where: { username: req.params.username },
  })
  if (!target) return res.status(404).json({ error: 'User not found' })
  if (target.id === req.userId) {
    return res.status(400).json({ error: "You can't follow yourself" })
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId:  req.userId,
        followingId: target.id,
      },
    },
  })

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } })
    return res.json({ isFollowing: false })
  }

  await prisma.follow.create({
    data: {
      followerId:  req.userId,
      followingId: target.id,
    },
  })
  res.json({ isFollowing: true })
})

// ── Error handler ────
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})