// Sanitized pagination: floors NaN/negative/zero input to safe defaults and
// caps page size so crafted query strings can neither 500 Prisma nor dump
// unbounded result sets.
const parsePagination = (query = {}, { defaultLimit = 20, maxLimit = 50 } = {}) => {
  const rawPage = parseInt(query.page, 10)
  const rawLimit = parseInt(query.limit, 10)
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit
  return { page, limit, skip: (page - 1) * limit, take: limit }
}

export { parsePagination }
