import { describe, it, expect, beforeEach } from 'vitest'

import useAuthStore from '../../src/stores/authStore'
import useQueryCache from '../../src/stores/queryCache'

describe('Auth Store', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAuthStore.setState({ user: null, isAuthenticated: false, isGuest: false })
    useQueryCache.setState({ entries: {} })
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

  it('patches the user without touching auth flags', () => {
    useAuthStore.getState().login({ id: 'user-123' })
    useAuthStore.getState().updateUser({ announcementSeenId: 'v2' })

    expect(useAuthStore.getState()).toMatchObject({
      user: { id: 'user-123', announcementSeenId: 'v2' },
      isAuthenticated: true,
    })
  })

  it('ignores patches with no signed-in user', () => {
    useAuthStore.getState().updateUser({ announcementSeenId: 'v2' })

    expect(useAuthStore.getState().user).toBeNull()
  })

  it('clears the query cache when a different user logs in', () => {
    useQueryCache.getState().setEntry('GET /api/reviewers/my', [])
    useQueryCache.getState().setEntry('GET /api/profile/me', {})
    useAuthStore.getState().login({ id: 'user-123' })
    expect(useQueryCache.getState().getEntry('GET /api/reviewers/my')).toBeNull()
    expect(useQueryCache.getState().getEntry('GET /api/profile/me')).toBeNull()
  })

  it('keeps the query cache when the same user session refreshes', () => {
    useAuthStore.getState().login({ id: 'user-123' })
    useQueryCache.getState().setEntry('GET /api/reviewers/my', [])
    useAuthStore.getState().login({ id: 'user-123' })
    expect(useQueryCache.getState().getEntry('GET /api/reviewers/my')).not.toBeNull()
  })

  it('clears the query cache on logout and guest switch', () => {
    useAuthStore.getState().login({ id: 'user-123' })
    useQueryCache.getState().setEntry('GET /api/reviewers/my', [])
    useAuthStore.getState().logout()
    expect(useQueryCache.getState().getEntry('GET /api/reviewers/my')).toBeNull()
    useQueryCache.getState().setEntry('GET /api/reviewers/my', [])
    useAuthStore.getState().enterGuest()
    expect(useQueryCache.getState().getEntry('GET /api/reviewers/my')).toBeNull()
  })
})
