import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('text=Review Well')).toBeVisible()
    await expect(page.locator('text=Sign in with Google')).toBeVisible()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/create')

    await expect(page).toHaveURL('/login')
  })

  test('should display login button in header when not authenticated', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('text=Sign in with Google')).toBeVisible()
  })

  test('should navigate to login page when clicking sign in', async ({ page }) => {
    await page.goto('/')

    await page.click('text=Sign in with Google')

    await expect(page).toHaveURL('/login')
  })
})
