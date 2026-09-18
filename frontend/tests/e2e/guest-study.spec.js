import { test, expect } from '@playwright/test'

// Guest taste-only journey: an unauthenticated visitor opens a public
// reviewer hub, flips a flashcard (React state only, zero writes), and sees
// the sign-in nudge with a return URL.
test.describe('Guest study hub', () => {
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
            cards: [
              { id: 'card-1', front: 'Front 1', back: 'Back 1', known: false },
              { id: 'card-2', front: 'Front 2', back: 'Back 2', known: false },
            ],
            prompts: ['Explain the light reactions'],
            quota: { decksLeft: 0, gradesLeft: 0 },
          },
        }),
      })
    })
  })

  test('guest flips a card and sees the sign-in nudge with a return URL', async ({ page }) => {
    const writes = []
    page.on('request', (request) => {
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method())) {
        writes.push(`${request.method()} ${request.url()}`)
      }
    })

    await page.goto('/reviewer/r1')

    await expect(page.getByRole('tab', { name: 'Flashcards' })).toBeVisible()
    await expect(page.getByTestId('study-guest-nudge')).toBeVisible()
    await expect(page.getByTestId('study-guest-nudge').locator('a')).toHaveAttribute(
      'href',
      '/login?returnTo=%2Freviewer%2Fr1'
    )

    await page.getByRole('tab', { name: 'Flashcards' }).click()
    await expect(page.getByText('Front 1')).toBeVisible()

    await page.getByRole('button', { name: 'Flip card' }).click()
    await expect(page.getByText('Back 1')).toBeVisible()

    // Taste-only: flipping never writes.
    expect(writes).toEqual([])
  })

  test('guest can open the Source tab and the Pomodoro timer', async ({ page }) => {
    await page.goto('/reviewer/r1')

    await expect(page.getByRole('tab', { name: 'Source' })).toBeVisible()
    await expect(page.getByTestId('study-source-pdf')).toBeVisible()
    await expect(page.getByLabel('Pomodoro timer')).toBeVisible()
  })
})
