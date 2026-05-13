// backend/prisma/seed.js
// Seeds the database with the 8 starter movies from src/data/mockData.js,
// two demo accounts, and sample reviews. Designed to run on any team member's
// machine after a fresh `prisma migrate dev`.
// Run:
//   cd backend
//   npx prisma db seed
//
// Safe to re-run — all writes use upsert / deleteMany + create so the database
// always ends in the same state, regardless of what was there before.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Demo accounts ──────────────────────────────────────────
// Both accounts use password "12345678" for easy team testing.
const demoAccounts = [
  {
    username:    'DemoAcc1',
    displayName: 'Demo Account 1',
    email:       'demoacc1@example.com',
    password:    '12345678',
  },
  {
    username:    'DemoAcc2',
    displayName: 'Demo Account 2',
    email:       'demoacc2@example.com',
    password:    '12345678',
  },
]

// ─── Movies (mirrors src/data/mockData.js) ─────────────────
const mockMovies = [
  {
    id: 1, title: 'Dune: Part Two', type: 'movie', year: 2024,
    genre: ['Sci-Fi', 'Adventure', 'Drama'], rating: 8.6,
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&h=600&fit=crop',
    director: 'Denis Villeneuve',
    synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    duration: '166 min', likes: 1842, reviewCount: 234,
  },
  {
    id: 2, title: 'Oppenheimer', type: 'movie', year: 2023,
    genre: ['Drama', 'History', 'Thriller'], rating: 8.9,
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=600&fit=crop',
    director: 'Christopher Nolan',
    synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    duration: '180 min', likes: 3210, reviewCount: 512,
  },
  {
    id: 3, title: 'The Bear', type: 'tv', year: 2022,
    genre: ['Drama', 'Comedy'], rating: 8.7,
    poster: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=600&fit=crop',
    director: 'Christopher Storer',
    synopsis: "A young chef from the fine dining world returns to Chicago to run his family's sandwich shop.",
    duration: '3 Seasons', likes: 2701, reviewCount: 388,
  },
  {
    id: 4, title: 'Poor Things', type: 'movie', year: 2023,
    genre: ['Comedy', 'Drama', 'Fantasy'], rating: 8.1,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=600&fit=crop',
    director: 'Yorgos Lanthimos',
    synopsis: 'The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by a brilliant scientist.',
    duration: '141 min', likes: 1456, reviewCount: 198,
  },
  {
    id: 5, title: 'Shogun', type: 'tv', year: 2024,
    genre: ['Drama', 'History', 'Action'], rating: 8.8,
    poster: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&h=600&fit=crop',
    director: 'Rachel Kondo',
    synopsis: 'A mysterious European ship wrecks on the coast of Japan, setting off a chain of events that will change the country forever.',
    duration: '1 Season', likes: 2980, reviewCount: 421,
  },
  {
    id: 6, title: 'Past Lives', type: 'movie', year: 2023,
    genre: ['Drama', 'Romance'], rating: 8.0,
    poster: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&h=600&fit=crop',
    director: 'Celine Song',
    synopsis: 'Two childhood friends are separated and meet again over 24 years, exploring concepts of love, loss, and the lives we choose.',
    duration: '106 min', likes: 987, reviewCount: 143,
  },
  {
    id: 7, title: 'Succession', type: 'tv', year: 2018,
    genre: ['Drama', 'Comedy'], rating: 9.0,
    poster: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=600&fit=crop',
    director: 'Jesse Armstrong',
    synopsis: "The Roy family, owners of a global media empire, fight for control of their company while the aging patriarch's health declines.",
    duration: '4 Seasons', likes: 4120, reviewCount: 631,
  },
  {
    id: 8, title: 'All of Us Strangers', type: 'movie', year: 2023,
    genre: ['Drama', 'Romance', 'Fantasy'], rating: 7.9,
    poster: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=1200&h=600&fit=crop',
    director: 'Andrew Haigh',
    synopsis: 'A screenwriter begins a relationship with his mysterious neighbour while visiting the ghost of his parents in his childhood home.',
    duration: '105 min', likes: 765, reviewCount: 112,
  },
]

// ─── Sample reviews ─────────────────────────────────────────
// Two reviews on Dune and on Oppenheimer (so sort/pagination
// have real data to work on), one review on The Bear.
// `demoIndex` refers to the index in demoAccounts above.
const sampleReviews = [
  {
    mediaId: 1, demoIndex: 0, rating: 9,
    content: "Villeneuve has done the impossible — made the unfilmable feel inevitable. Every frame is a painting. Zendaya's performance in the second half is career-defining.",
    createdAt: '2024-03-02',
  },
  {
    mediaId: 1, demoIndex: 1, rating: 8,
    content: 'The spectacle is undeniable but I wish we spent more time with the Fremen culture. Still, this is blockbuster filmmaking at its most ambitious.',
    createdAt: '2024-03-05',
  },
  {
    mediaId: 2, demoIndex: 0, rating: 10,
    content: 'Hoyte van Hoytema deserves another Oscar just for this. The practical effects, the IMAX compositions — this is why cinema exists.',
    createdAt: '2023-07-25',
  },
  {
    mediaId: 2, demoIndex: 1, rating: 9,
    content: "A three-hour conversation about responsibility, hubris, and consequence. Nolan's tightest screenplay in years. The chamber scenes hum with dread.",
    createdAt: '2023-08-01',
  },
  {
    mediaId: 3, demoIndex: 0, rating: 9,
    content: 'The kitchen sequences alone contain more tension than most thrillers. Jeremy Allen White is electric. Season 2\'s "Fishes" episode is a masterclass.',
    createdAt: '2023-08-10',
  },
]

// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database…\n')

  // 1. Movies — upsert so existing data is preserved/updated
  for (const m of mockMovies) {
    const data = {
      title: m.title, type: m.type, year: m.year,
      genre: JSON.stringify(m.genre), rating: m.rating,
      reviewCount: m.reviewCount, likes: m.likes,
      poster: m.poster, backdrop: m.backdrop,
      synopsis: m.synopsis, director: m.director, duration: m.duration,
    }
    await prisma.media.upsert({
      where: { id: m.id },
      update: data,
      create: { id: m.id, ...data },
    })
  }
  console.log(`  ✓ ${mockMovies.length} movies`)

  // 2. Demo accounts — upsert so passwords stay consistent across runs
  const demoUsers = []
  for (const acc of demoAccounts) {
    const hashedPwd = await bcrypt.hash(acc.password, 10)
    const user = await prisma.user.upsert({
      where: { username: acc.username },
      update: { password: hashedPwd },
      create: {
        username:    acc.username,
        displayName: acc.displayName,
        email:       acc.email,
        password:    hashedPwd,
      },
    })
    demoUsers.push(user)
  }
  console.log(`  ✓ ${demoAccounts.length} demo accounts (login password: 12345678)`)

  // 3. Sample reviews — clear demo users' existing reviews, then re-create
  // (only removes reviews from the demo accounts, not from real team members)
  const demoUserIds = demoUsers.map(u => u.id)
  await prisma.review.deleteMany({ where: { userId: { in: demoUserIds } } })

  for (const r of sampleReviews) {
    await prisma.review.create({
      data: {
        rating:    r.rating,
        content:   r.content,
        userId:    demoUsers[r.demoIndex].id,
        mediaId:   r.mediaId,
        createdAt: new Date(r.createdAt),
      },
    })
  }
  console.log(`  ✓ ${sampleReviews.length} sample reviews`)

  console.log('\nSeed complete.')
  console.log('\nDemo logins:')
  for (const acc of demoAccounts) {
    console.log(`  • ${acc.username} / ${acc.password}`)
  }
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })