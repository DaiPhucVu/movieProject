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
    return res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email }, token })
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
  return res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email }, token })
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

// ── Error handler ────
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})