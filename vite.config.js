import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
// Dev: base '/' so localhost:5173/media/... reload works.
// Build: subdirectory on the university server.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cos30043/s104205032/movieProject' : '/',
  plugins: [vue()],
}))