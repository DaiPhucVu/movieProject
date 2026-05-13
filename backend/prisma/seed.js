// Seeds the database with the 8 starter movies and the shared DemoAcc1 account.
// Designed to run on any team member's machine after `npx prisma migrate dev`.
// Run:
//   cd backend
//   npx prisma db seed
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Demo account (shared across the team) ────────
const demoAccount = {
  username:    'DemoAcc1',
  displayName: 'Demo Account 1',
  email:       'demoacc1@example.com',
  password:    '12345678',
}

// ─── Movies (mirrors src/data/mockData.js) ────────
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

async function main() {
  console.log('Seeding database…\n')
  // 1. Movies
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

  // 2. Demo account
  const hashedPwd = await bcrypt.hash(demoAccount.password, 10)
  await prisma.user.upsert({
    where: { username: demoAccount.username },
    update: { password: hashedPwd },
    create: {
      username:    demoAccount.username,
      displayName: demoAccount.displayName,
      email:       demoAccount.email,
      password:    hashedPwd,
    },
  })
  console.log(`  ✓ ${demoAccount.username} ready (password: ${demoAccount.password})`)

  console.log('\nSeed complete.')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })