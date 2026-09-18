// Shared quota limits (single source of truth — import, don't duplicate).
//
// DECK_QUOTA_LIMIT: 3 AI deck generations per rolling 7-day window per user.
// Enforced by aiController (generation) and read by reviewerController
// (study-hub quota display).
const DECK_QUOTA_LIMIT = 3

export { DECK_QUOTA_LIMIT }
