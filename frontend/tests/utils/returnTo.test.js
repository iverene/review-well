import { describe, it, expect, beforeEach } from 'vitest'

import { rememberReturnTo, safeInternalPath, takeReturnTo } from '../../src/utils/returnTo'

describe('returnTo handoff', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('hands a remembered page to the callback exactly once', () => {
    rememberReturnTo('/reviewer/r1')
    expect(takeReturnTo()).toBe('/reviewer/r1')
    expect(takeReturnTo()).toBeNull()
  })

  it('never remembers off-site or protocol-relative targets', () => {
    rememberReturnTo('https://evil.example')
    expect(takeReturnTo()).toBeNull()
    rememberReturnTo('//evil.example')
    expect(takeReturnTo()).toBeNull()
    expect(safeInternalPath('/profile/u1')).toBe('/profile/u1')
  })

  it('clears a stale target when signing in from home', () => {
    rememberReturnTo('/reviewer/r1')
    rememberReturnTo('/')
    expect(takeReturnTo()).toBeNull()
  })
})
