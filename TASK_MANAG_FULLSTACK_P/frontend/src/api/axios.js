import axios from 'axios'
import { toast } from 'react-toastify'
import useAuthStore from '../store/authStore'

//  http://127.0.0.1:8000
//  https://task-management-backend-production-098f.up.railway.app
// this is a shared axios instance for making requests to the backend
// instead of writing axios.get(url) we can write api.get(url)
// and it will automatically add the base url and the token
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login') {
        toast.error('Session expired. Please login again.')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default api
