import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import PushToggle, { urlBase64ToUint8Array } from '../../src/components/PushToggle'

describe('urlBase64ToUint8Array', () => {
  it('decodes URL-safe base64', () => {
    const bytes = urlBase64ToUint8Array('AQID')
    expect([...bytes]).toEqual([1, 2, 3])
  })
})

describe('PushToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('explains when push is unsupported', () => {
    render(<PushToggle />)
    expect(screen.getByText('Push notifications are not supported on this browser.')).toBeInTheDocument()
  })
})
