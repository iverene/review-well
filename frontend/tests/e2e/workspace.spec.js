import { test, expect } from '@playwright/test'

test.describe('Workspace', () => {
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

    // Mock reviewer data
    await page.route('**/api/reviewers/1', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviewer: {
            id: '1',
            title: 'Test Reviewer',
            courseCode: 'MATH 101',
            semester: 'Fall 2024',
            visibility: 'public',
            isDraft: true,
            authorId: 'user-123',
            blocks: [
              {
                id: 'block-1',
                blockType: 'topic_banner',
                contentData: { heading: 'Chapter 1' },
                columnIndex: 1,
                sortOrder: 0,
              },
            ],
          },
        }),
      })
    })
  })

  test('should load workspace with reviewer data', async ({ page }) => {
    await page.goto('/workspace/1')

    await expect(page.locator('input[value="Test Reviewer"]')).toBeVisible()
    await expect(page.locator('text=MATH 101')).toBeVisible()
  })

  test('should display existing blocks', async ({ page }) => {
    await page.goto('/workspace/1')

    await expect(page.locator('input[value="Chapter 1"]')).toBeVisible()
  })

  test('should open add block menu', async ({ page }) => {
    await page.goto('/workspace/1')

    await page.click('text=Add Block')

    await expect(page.locator('text=Topic Header')).toBeVisible()
    await expect(page.locator('text=Content Block')).toBeVisible()
    await expect(page.locator('text=Table')).toBeVisible()
  })

  test('should save reviewer changes', async ({ page }) => {
    await page.goto('/workspace/1')

    // Update title
    await page.fill('input[value="Test Reviewer"]', 'Updated Reviewer')

    // Click save
    await page.click('text=Save')

    // Should show saving state
    await expect(page.locator('text=Saving...')).toBeVisible()
  })
})
