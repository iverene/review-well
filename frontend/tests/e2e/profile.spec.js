import { test, expect } from '@playwright/test'

import { completeUser, dismissAnnouncements, json, mockSession } from './helpers'

const profilePayload = {
  ...completeUser,
  reviewerCount: 5,
  followerCount: 10,
  followingCount: 3,
}

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await dismissAnnouncements(page)
    await mockSession(page)
    await page.route('**/api/profile/me', (route) => route.fulfill(json({ user: profilePayload })))
    await page.route('**/api/reviewers/my*', (route) => route.fulfill(json({ reviewers: [], pagination: { hasMore: false } })))
    await page.route('**/api/social/saved*', (route) => route.fulfill(json({ reviewers: [], pagination: { hasMore: false } })))
  })

  test('should display own profile', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.getByRole('heading', { level: 1, name: 'Test User' })).toBeVisible()
    await expect(page.getByText('MIT', { exact: true })).toBeVisible()
  })

  test('should show profile stats', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.getByLabel('5 reviewers')).toBeVisible()
    await expect(page.getByRole('link', { name: 'View followers, 10' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'View following, 3' })).toBeVisible()
  })

  test('should navigate to account settings', async ({ page }) => {
    await page.goto('/profile')

    await page.getByRole('link', { name: 'Edit account' }).click()

    await expect(page).toHaveURL('/settings/account')
  })
})

test.describe('Account settings', () => {
  test.beforeEach(async ({ page }) => {
    await dismissAnnouncements(page)
    await mockSession(page)
  })

  test('should display the account form', async ({ page }) => {
    await page.route('**/api/profile/me', (route) => route.fulfill(json({ user: profilePayload })))
    await page.goto('/settings/account')

    await expect(page.getByRole('heading', { level: 1, name: 'Account' })).toBeVisible()
    await expect(page.getByLabel('Display Name')).toHaveValue('Test User')
  })

  test('should update profile', async ({ page }) => {
    await page.route('**/api/profile/me', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill(json({ user: { ...profilePayload, displayName: 'Updated Name' } }))
      }
      return route.fulfill(json({ user: profilePayload }))
    })
    await page.goto('/settings/account')

    await page.getByLabel('Display Name').fill('Updated Name')
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByText('Profile updated successfully')).toBeVisible()
  })
})
