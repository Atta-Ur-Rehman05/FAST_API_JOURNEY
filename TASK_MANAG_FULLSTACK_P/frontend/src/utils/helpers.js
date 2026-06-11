import dayjs from 'dayjs'

export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  const detail = error.response?.data?.detail

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(', ')
  }

  return detail || error.message || fallback
}

export const formatDate = (date, fallback = 'No date') => {
  if (!date) return fallback
  return dayjs(date).format('MMM D, YYYY')
}

export const toDatetimeLocalValue = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DDTHH:mm')
}

export const fromDatetimeLocalValue = (date) => {
  if (!date) return null
  return dayjs(date).toISOString()
}
