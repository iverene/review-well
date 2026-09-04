import { describe, it, expect, beforeEach } from 'vitest'

import useAuthStore from '../../src/stores/authStore'

describe('Auth Store', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAuthStore.setState({ user: null, isAuthenticated: false, isGuest: false })
  })

  it('enters guest mode without authenticating', () => {
    useAuthStore.getState().enterGuest()

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      isGuest: true,
    })
    expect(window.localStorage.getItem('review-well-guest')).toBe('true')
  })

  it('clears guest mode on logout', () => {
    useAuthStore.getState().enterGuest()
    useAuthStore.getState().logout()

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      isGuest: false,
    })
    expect(window.localStorage.getItem('review-well-guest')).toBeNull()
  })

  it('clears guest mode when a Google user logs in', () => {
    useAuthStore.getState().enterGuest()
    useAuthStore.getState().login({ id: 'user-123' })

    expect(useAuthStore.getState()).toMatchObject({
      user: { id: 'user-123' },
      isAuthenticated: true,
      isGuest: false,
    })
    expect(window.localStorage.getItem('review-well-guest')).toBeNull()
  })
})
