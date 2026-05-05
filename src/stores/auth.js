// stores/auth.js
// Handles login, register and logout by calling the backend API.
// On success, user data is saved to Pinia state AND localStorage so that
// the session survives a page refresh.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API = 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', () => {

  // ── State
  // Restore user from localStorage on first load (persists across refreshes)
  const user = ref(JSON.parse(localStorage.getItem('cinelog_user')) || null)

  // ── Getters 
  const isAuthenticated = computed(() => !!user.value)

  // ── Actions 

  // register() — creates a new account on the backend
  // Accepts the same form object your RegisterView sends
  async function register(formData) {
    try {
      const response = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:    formData.username,
          displayName: formData.displayName,
          email:       formData.email,
          password:    formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Backend returned a 4xx error — pass the message to the form
        return { success: false, error: data.error }
      }

      // Auto-login after successful registration
      user.value = data.user
      localStorage.setItem('cinelog_user', JSON.stringify(data.user))
      return { success: true }

    } catch (err) {
      // Network error — backend is probably not running
      return { success: false, error: 'Cannot connect to server. Is the backend running?' }
    }
  }

  // login() — verifies credentials and loads user data
  async function login(username, password) {
    try {
      const response = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error }
      }

      // Save user to Pinia state + localStorage
      user.value = data.user
      localStorage.setItem('cinelog_user', JSON.stringify(data.user))
      return { success: true }

    } catch (err) {
      return { success: false, error: 'Cannot connect to server. Is the backend running?' }
    }
  }

  // logout() — clears the session everywhere
  function logout() {
    user.value = null
    localStorage.removeItem('cinelog_user')
  }

  return { user, isAuthenticated, login, register, logout }
})
