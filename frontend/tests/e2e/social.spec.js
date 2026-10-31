import { test, expect } from '@playwright/test'

import { dismissAnnouncements, json, mockSession } from './helpers'

test.describe('Social Features', () => {
  test.beforeEach(async ({ page }) => {
    await dismissAnnouncements(page)
    await mockSession(page)
    await page.route('**/api/reviewers/**', (route) => route.fulfill(json({ reviewers: [] })))
    await page.route('**/api/social/notifications/unread-count', (route) => route.fulfill(json({ count: 3 })))
  })

  test('should show notification badge with count', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('banner').locator('a[href="/notifications"]')).toContainText('3')
  })

  test('should navigate to notifications page', async ({ page }) => {
    await page.route('**/api/social/notifications?*', (route) => route.fulfill(json({ notifications: [], total: 0 })))
    await page.goto('/')

    await page.getByRole('banner').locator('a[href="/notifications"]').click()

    await expect(page).toHaveURL('/notifications')
  })

  test('should show notifications list', async ({ page }) => {
    await page.route('**/api/social/notifications?*', (route) => route.fulfill(json({
      notifications: [
        {
          id: 'notif-1',
          actorId: 'user-9',
          actor: { id: 'user-9', displayName: 'John Doe', avatarUrl: null },
          actionType: 'save',
          reviewerId: 'r1',
          reviewer: { id: 'r1', title: 'Test Reviewer' },
          isRead: false,
          isSaved: false,
          saveCount: 1,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
    })))

    await page.goto('/notifications')

    await expect(page.getByText('John Doe')).toBeVisible()
    await expect(page.getByText('saved your reviewer')).toBeVisible()
  })
})
