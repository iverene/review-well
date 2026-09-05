const stripTrailingSlash = (url) => (url || '').trim().replace(/\/+$/, '')

const getBackendUrl = () => stripTrailingSlash(process.env.BACKEND_URL) || 'http://localhost:3000'

const getFrontendUrl = () => stripTrailingSlash(process.env.FRONTEND_URL) || 'http://localhost:5173'

const getGoogleCallbackUrl = () => `${getBackendUrl()}/api/auth/google/callback`

const getFrontendRedirect = (path = '/auth/callback') => {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${getFrontendUrl()}${suffix}`
}

export { getBackendUrl, getFrontendUrl, getGoogleCallbackUrl, getFrontendRedirect }
