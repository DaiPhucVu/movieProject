// Seeds the database with the shared DemoAcc1 account.
// Movies are now fetched from the TMDB API at runtime — they no longer
// Run:
//   cd backend
//   npx prisma db seed
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const demoAccount = {
  username:    'DemoAcc1',
  displayName: 'Demo Account 1',
  email:       'demoacc1@example.com',
  password:    '12345678',
}

async function main() {
  console.log('Seeding database…\n')

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
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })