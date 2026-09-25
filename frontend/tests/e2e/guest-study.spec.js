import { test, expect } from '@playwright/test'

// Guest view-only journey: an unauthenticated visitor opens a public
// reviewer hub, sees the source file and the sign-in nudge with a return
// URL — and triggers zero writes.
test.describe('Guest reviewer hub', () => {
  test.beforeEach(async ({ page }) => {
    // Guest: no session
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not authenticated' }),
      })
    })

    // Public reviewer hub payload (fileUrl + cards + prompts + quota)
    await page.route('**/api/reviewers/r1', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviewer: {
            id: 'r1',
            title: 'Photosynthesis',
            courseCode: 'BIO 101',
            courseDescription: 'Photosynthesis',
            examType: 'midterm',
            semester: 'Fall 2026',
            visibility: 'public',
            isDraft: false,
            authorId: 'owner-1',
            updatedAt: '2026-09-01T00:00:00.000Z',
            user: { displayName: 'Test Author' },
            _count: { saves: 0 },
            fileUrl: 'https://storage.example.com/v1.pdf',
            cards: [],
            prompts: [],
            quota: { decksLeft: 0, gradesLeft: 0 },
          },
        }),
      })
    })
  })

  test('guest views the source file with no sign-in nudge', async ({ page }) => {
    const writes = []
    page.on('request', (request) => {
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method())) {
        writes.push(`${request.method()} ${request.url()}`)
      }
    })

    await page.goto('/reviewer/r1')

    await expect(page.getByTestId('study-source-pdf')).toBeVisible()
    await expect(page.getByTestId('study-guest-nudge')).toHaveCount(0)

    // No study-mode tabs while the modes are parked.
    await expect(page.getByRole('tab', { name: 'Flashcards' })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: 'Blurting' })).toHaveCount(0)

    // View-only: reading never writes.
    expect(writes).toEqual([])
  })
})
