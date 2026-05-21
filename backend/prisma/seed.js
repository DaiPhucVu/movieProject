// Seeds the database with a few demo accounts and a couple of follow edges
// so the Profile / Followers / Following pages have something to render.
//
// Run:
//   cd backend
//   npx prisma db seed
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const demoAccounts = [
  {
    username:    'DemoAcc1',
    displayName: 'Demo Account 1',
    email:       'demoacc1@example.com',
    password:    '12345678',
    bio:         'Just here to log every film I watch.',
  },
  {
    username:    'cinephile_kai',
    displayName: 'Kai Nakamura',
    email:       'kai@example.com',
    password:    '12345678',
    bio:         'Slow-cinema enjoyer. Letterboxd refugee.',
  },
  {
    username:    'reeltalks',
    displayName: 'Reel Talks',
    email:       'reeltalks@example.com',
    password:    '12345678',
    bio:         'Talking about every reel, frame by frame.',
  },
  {
    username:    'framebyframe',
    displayName: 'Frame Frame',
    email:       'frame@example.com',
    password:    '12345678',
    bio:         'Hot takes only.',
  },
]

async function main() {
  console.log('Seeding database…\n')

  // Upsert each demo account
  const users = {}
  for (const acc of demoAccounts) {
    const hashedPwd = await bcrypt.hash(acc.password, 10)
    const user = await prisma.user.upsert({
      where:  { username: acc.username },
      update: { password: hashedPwd, bio: acc.bio, displayName: acc.displayName },
      create: {
        username:    acc.username,
        displayName: acc.displayName,
        email:       acc.email,
        password:    hashedPwd,
        bio:         acc.bio,
      },
    })
    users[acc.username] = user
    console.log(`  ✓ ${acc.username} ready (password: ${acc.password})`)
  }

  // A few follow edges so the Connections page is not empty.
  // DemoAcc1 follows the other three; they follow each other in a ring.
  const edges = [
    ['DemoAcc1',      'cinephile_kai'],
    ['DemoAcc1',      'reeltalks'],
    ['DemoAcc1',      'framebyframe'],
    ['cinephile_kai', 'DemoAcc1'],
    ['reeltalks',     'cinephile_kai'],
    ['framebyframe',  'reeltalks'],
  ]

  for (const [follower, following] of edges) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId:  users[follower].id,
          followingId: users[following].id,
        },
      },
      update: {},
      create: {
        followerId:  users[follower].id,
        followingId: users[following].id,
      },
    })
  }
  console.log(`  ✓ ${edges.length} follow edges seeded`)

  console.log('\nSeed complete.')
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
