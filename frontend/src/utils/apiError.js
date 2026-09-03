import axios from 'axios'

const statusMessages = {
  400: 'Please check your input and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you requested.',
  409: 'That action conflicts with the current data.',
  413: 'That file is too large to upload.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again.',
}

const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const serverMessage = error.response?.data?.error
  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage
  }

  if (error.response?.status && statusMessages[error.response.status]) {
    return statusMessages[error.response.status]
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Unable to reach Review Well. Check that the server is running and try again.'
  }

  return fallback
}

export { getApiErrorMessage }
