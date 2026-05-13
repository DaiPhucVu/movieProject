# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).


# How the backend work
### Note: 
Backend is done, to run both backend and the app at once pls do this in cd movieProject
```bash
npm run dev:all
```
otherwise u will have to run them one by one

Located in folder named backend

- 'express' is for HTTP routing
- 'cors' so the frontend can request the backend
- 'dotenv' to load .env
- 'prisma' + '@prisma/client' for database access
- 'sqlite' via 'prisma' for local development

## Backend flow

- 'server.js' starts 'Express' and 'Prisma'.
- Middleware:
  - 'cors()' enables cross-origin requests from Vite
  - 'express.json()' parses JSON bodies
- Auth:
  - '/api/auth/register' hashes passwords and creates a user
  - '/api/auth/login' verifies credentials and returns a JWT
- Protected routes:
  - require 'Authorization: Bearer < token >'
  - the token is validated before accessing 'watchlist/review' endpoints
- Data:
  - Media, User, Review, Watchlist are stored in SQLite (dev.db file)
  - Prisma handles schema + database queries