const isProfileComplete = (user) => Boolean(
  user?.school?.trim() &&
  user?.program?.trim() &&
  user?.major?.trim() &&
  user?.yearLevel?.trim()
)

// Year levels are stored as lowercase values; display the proper label
// ("senior" -> "Senior", "phd" -> "PhD"). Unknown values are capitalized.
const YEAR_LEVELS = [
  { value: 'freshman', label: 'Freshman' },
  { value: 'sophomore', label: 'Sophomore' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Other' },
]

const formatYearLevel = (value) => {
  if (!value) return ''
  const match = YEAR_LEVELS.find((level) => level.value === String(value).toLowerCase())
  if (match) return match.label
  const text = String(value)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export { isProfileComplete, YEAR_LEVELS, formatYearLevel }
