import api from '../api/axios'

export const getTasks = async (params = {}) => {
  const response = await api.get('/tasks/', { params })
  const data = response.data

  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: params.page || 1,
      size: params.size || data.length,
      pages: 1,
    }
  }

  return data
}

export const createTask = async (payload) => {
  const response = await api.post('/tasks/', payload)
  return response.data
}

export const updateTask = async (id, payload) => {
  const response = await api.put(`/tasks/${id}`, payload)
  return response.data
}

export const deleteTask = async (id) => {
  await api.delete(`/tasks/${id}`)
}
