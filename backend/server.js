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

app.get('/api/media', async (req, res) => {
  const media = await prisma.media.findMany({
    orderBy: { rating: 'desc' },
  })
  res.json({ media })
})

app.get('/api/media/:id', async (req, res) => {
  const id = Number(req.params.id)
  const media = await prisma.media.findUnique({
    where: { id },
    include: { reviews: true },
  })
  if (!media) return res.status(404).json({ error: 'Media not found' })
  res.json({ media })
})

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
      mediaId,
      rating,
      content,
      userId: req.userId,
    },
  })

  await prisma.media.update({
    where: { id: mediaId },
    data: {
      reviewCount: { increment: 1 },
      rating: {
        set: await calculateAverageRating(mediaId),
      },
    },
  })

  res.status(201).json({ review })
})

app.get('/api/watchlist/:userId', authenticate, async (req, res) => {
  const userId = Number(req.params.userId)
  if (req.userId !== userId) return res.status(403).json({ error: 'Unauthorized' })

  const items = await prisma.watchlist.findMany({
    where: { userId },
    include: { media: true },
  })
  res.json({ watchlist: items.map(item => item.media) })
})

app.post('/api/watchlist/toggle', authenticate, async (req, res) => {
  const { mediaId } = req.body
  if (!mediaId) return res.status(400).json({ error: 'Missing mediaId' })

  const existing = await prisma.watchlist.findFirst({
    where: { userId: req.userId, mediaId },
  })
  if (existing) {
    await prisma.watchlist.delete({ where: { id: existing.id } })
    return res.json({ saved: false })
  }

  await prisma.watchlist.create({
    data: { userId: req.userId, mediaId },
  })
  res.json({ saved: true })
})

async function calculateAverageRating(mediaId) {
  const reviews = await prisma.review.findMany({ where: { mediaId } })
  if (!reviews.length) return 0
  const sum = reviews.reduce((total, review) => total + review.rating, 0)
  return Number((sum / reviews.length).toFixed(1))
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
