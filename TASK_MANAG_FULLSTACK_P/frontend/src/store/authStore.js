import { create } from 'zustand'

const storedToken = localStorage.getItem('access_token')
const storedUser = localStorage.getItem('user')

const useAuthStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),

  login: ({ user, token }) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

export default useAuthStore
