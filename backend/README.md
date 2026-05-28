# CineLOG Backend

This backend is a simple Express + Prisma service for the CineLOG app.

## Setup

1. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Create the backend environment file:

   ```bash
   cd backend
   cp .env.example .env
   ```

3. Generate Prisma client and apply migrations:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

   Or use the helper script:

   ```bash
   npm run setup
   ```

4. Start the server:

   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3000` by default.

# Database structure
The database has these tables
- User
  - id, username, displayName, email, password, createdAt
- Media
  - id, title, type, year, genre, rating, reviewCount, likes, poster, backdrop, synopsis, director, duration
- Review
  - id, rating, content, createdAt, userId, mediaId
- Watchlist
  - id, userId, mediaId

