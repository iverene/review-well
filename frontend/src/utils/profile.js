const isProfileComplete = (user) => Boolean(
  user?.school?.trim() &&
  user?.program?.trim() &&
  user?.major?.trim() &&
  user?.yearLevel?.trim()
)

export { isProfileComplete }
