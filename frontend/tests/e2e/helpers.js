// Shared e2e helpers.

// The first-visit announcement overlays every page and intercepts clicks.
// Treat every announcement id as already dismissed so journeys stay focused
// (AnnouncementModal has its own unit tests). Matching the key prefix keeps
// this working when the announcement id is bumped.
export const dismissAnnouncements = (page) => page.addInitScript(() => {
  const getItem = Storage.prototype.getItem
  Storage.prototype.getItem = function patchedGetItem(key) {
    if (String(key).startsWith('review-well-announcement-')) return 'dismissed'
    return getItem.call(this, key)
  }
})

export const completeUser = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  avatarUrl: null,
  school: 'MIT',
  program: 'Computer Science',
  major: 'Software Engineering',
  yearLevel: 'senior',
}

export const json = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

// Signed-in session for `user`, or a guest (401) when `user` is null.
export const mockSession = (page, user = completeUser) => page.route('**/api/auth/me', (route) => (
  user ? route.fulfill(json({ user })) : route.fulfill(json({ error: 'Not authenticated' }, 401))
))
