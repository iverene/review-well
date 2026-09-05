import { describe, it, expect, afterEach } from 'vitest'

import {
  getBackendUrl,
  getFrontendUrl,
  getGoogleCallbackUrl,
  getFrontendRedirect,
} from '../../../config/urls.js'

const OLD_BACKEND = process.env.BACKEND_URL
const OLD_FRONTEND = process.env.FRONTEND_URL

afterEach(() => {
  if (OLD_BACKEND === undefined) delete process.env.BACKEND_URL
  else process.env.BACKEND_URL = OLD_BACKEND
  if (OLD_FRONTEND === undefined) delete process.env.FRONTEND_URL
  else process.env.FRONTEND_URL = OLD_FRONTEND
})

describe('URL helpers', () => {
  it('uses BACKEND_URL for the Google callback without double slashes', () => {
    process.env.BACKEND_URL = 'https://api.example.com/'
    expect(getGoogleCallbackUrl()).toBe('https://api.example.com/api/auth/google/callback')
  })

  it('defaults backend to localhost for local dev only', () => {
    delete process.env.BACKEND_URL
    expect(getBackendUrl()).toBe('http://localhost:3000')
    expect(getGoogleCallbackUrl()).toBe('http://localhost:3000/api/auth/google/callback')
  })

  it('uses FRONTEND_URL for post-login redirects without double slashes', () => {
    process.env.FRONTEND_URL = 'https://app.example.com/'
    expect(getFrontendUrl()).toBe('https://app.example.com')
    expect(getFrontendRedirect('/auth/callback')).toBe('https://app.example.com/auth/callback')
  })

  it('defaults frontend to localhost for local dev only', () => {
    delete process.env.FRONTEND_URL
    expect(getFrontendUrl()).toBe('http://localhost:5173')
    expect(getFrontendRedirect('/login')).toBe('http://localhost:5173/login')
  })
})
