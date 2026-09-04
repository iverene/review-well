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
            title: 'Calculus',
            courseCode: 'MATH 101',
            courseDescription: 'Calculus',
            examType: 'midterm',
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

    await expect(page.getByLabel('Document title')).toHaveValue('Calculus')
    await expect(page.locator('text=Midterm · Fall 2024')).toBeVisible()
  })

  test('should display existing blocks', async ({ page }) => {
    await page.goto('/workspace/1')

    await expect(page.getByRole('textbox', { name: 'Main topic heading' })).toContainText('Chapter 1')
  })

  test('should open insert menu with structured blocks', async ({ page }) => {
    await page.goto('/workspace/1')

    await page.getByRole('button', { name: 'Insert' }).click()

    await expect(page.getByRole('menuitem', { name: 'Main Topic' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Terms and Definitions Card' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Blank Page' })).toBeVisible()
  })

  test('should save reviewer changes', async ({ page }) => {
    await page.goto('/workspace/1')

    // Update title
    await page.getByLabel('Document title').fill('Updated Reviewer')

    // Click save via File menu
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Save' }).click()

    // Should show saving state
    await expect(page.locator('text=Saving…')).toBeVisible()
  })
})
