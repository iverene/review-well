import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import StudyTabs from '../../src/components/StudyTabs'

vi.mock('../../src/components/PdfViewer', () => ({
  default: () => <div data-testid="study-source-pdf" />,
}))

describe('StudyTabs source panel', () => {
  it('embeds PPTX sources in a full-width, slide-shaped frame', () => {
    render(<StudyTabs reviewer={{ title: 'Slides', fileUrl: 'https://storage.example.com/u/r1/v1.pptx?token=a' }} />)
    const frame = screen.getByTitle('Source presentation')
    expect(frame.getAttribute('src')).toContain(encodeURIComponent('https://storage.example.com/u/r1/v1.pptx?token=a'))
    // Without explicit sizing an iframe falls back to the 300x150 default.
    expect(frame).toHaveClass('w-full', 'aspect-video')
  })

  it('loads the PDF viewer on demand for PDF sources', async () => {
    render(<StudyTabs reviewer={{ title: 'Notes', fileUrl: 'https://storage.example.com/u/r1/v1.pdf' }} />)
    expect(screen.getByRole('status', { name: 'Loading document' })).toBeInTheDocument()
    expect(await screen.findByTestId('study-source-pdf')).toBeInTheDocument()
  })
})
