import { test, expect } from '@playwright/test'

test.describe('Profile', () => {
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
            school: 'MIT',
            program: 'Computer Science',
          },
        }),
      })
    })

    // Mock profile data
    await page.route('**/api/profile/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            avatarUrl: null,
            school: 'MIT',
            program: 'Computer Science',
            major: 'Software Engineering',
            yearLevel: 'senior',
            reviewerCount: 5,
            followerCount: 10,
            followingCount: 3,
          },
        }),
      })
    })
  })

  test('should display own profile', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.locator('text=Test User')).toBeVisible()
    await expect(page.locator('text=MIT')).toBeVisible()
  })

  test('should show profile stats', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.locator('text=5')).toBeVisible()
    await expect(page.locator('text=10')).toBeVisible()
    await expect(page.locator('text=3')).toBeVisible()
  })

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/profile')

    await page.click('text=Edit Profile')

    await expect(page).toHaveURL('/settings')
  })
})

test.describe('Settings', () => {
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
          },
        }),
      })
    })

    // Mock profile data
    await page.route('**/api/profile/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            school: 'MIT',
            program: 'Computer Science',
          },
        }),
      })
    })
  })

  test('should display settings form', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.locator('text=Settings')).toBeVisible()
    await expect(page.locator('input[value="Test User"]')).toBeVisible()
  })

  test('should update profile', async ({ page }) => {
    await page.route('**/api/profile/me', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'user-123',
              displayName: 'Updated Name',
            },
          }),
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'user-123',
              displayName: 'Test User',
            },
          }),
        })
      }
    })

    await page.goto('/settings')

    await page.fill('input[name="displayName"]', 'Updated Name')
    await page.click('text=Save Changes')

    await expect(page.locator('text=Profile updated successfully')).toBeVisible()
  })
})
