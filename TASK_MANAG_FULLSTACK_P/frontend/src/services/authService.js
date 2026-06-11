import api from '../api/axios'

export const registerUser = async ({ username, password }) => {
  const response = await api.post('/register', { username, password })
  return response.data
}

export const loginUser = async ({ username, password }) => {
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', password)

  const response = await api.post('/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/me')
  return response.data
}
