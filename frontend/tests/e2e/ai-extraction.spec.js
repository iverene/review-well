import { test, expect } from '@playwright/test'

test.describe('AI Extraction', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            avatarUrl: null,
          },
        }),
      })
    })

    // Mock quota status
    await page.route('**/api/ai/quota', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          remaining: 45,
          limit: 50,
          configured: true,
        }),
      })
    })
  })

  test('should show AI extraction option on create page', async ({ page }) => {
    await page.goto('/create')

    await expect(page.locator('text=AI Extraction')).toBeVisible()
  })

  test('should show quota information', async ({ page }) => {
    await page.goto('/create')

    await expect(page.locator('text=45')).toBeVisible()
  })

  test('should have file upload input', async ({ page }) => {
    await page.goto('/create')

    await expect(page.locator('input[type="file"]')).toBeVisible()
  })
})
