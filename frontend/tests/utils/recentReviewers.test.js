import { describe, it, expect, beforeEach } from 'vitest'

import { purgeRecentReviewer, recentReviewersKey } from '../../src/utils/recentReviewers'

describe('purgeRecentReviewer', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('removes the deleted reviewer from every user key', () => {
    window.localStorage.setItem(recentReviewersKey('user-1'), JSON.stringify([{ id: 'r1' }, { id: 'r2' }]))
    window.localStorage.setItem(recentReviewersKey('user-2'), JSON.stringify([{ id: 'r1' }]))
    window.localStorage.setItem('unrelated', 'keep')

    purgeRecentReviewer('r1')

    expect(JSON.parse(window.localStorage.getItem(recentReviewersKey('user-1')))).toEqual([{ id: 'r2' }])
    expect(window.localStorage.getItem(recentReviewersKey('user-2'))).toBeNull()
    expect(window.localStorage.getItem('unrelated')).toBe('keep')
  })

  it('does nothing when the id is absent', () => {
    window.localStorage.setItem(recentReviewersKey('user-1'), JSON.stringify([{ id: 'r9' }]))
    purgeRecentReviewer('r1')
    expect(JSON.parse(window.localStorage.getItem(recentReviewersKey('user-1')))).toEqual([{ id: 'r9' }])
  })
})
