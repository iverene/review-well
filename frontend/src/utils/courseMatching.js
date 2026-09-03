const normalizeCourseText = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const isMeaningfulCourseMatch = (left, right) => (
  left === right || (Math.min(left.length, right.length) >= 4 && (left.includes(right) || right.includes(left)))
)

const isSameCourse = (reviewer, user) => {
  const userCourses = [user?.program, user?.major].map(normalizeCourseText).filter(Boolean)
  const reviewerCourses = [reviewer.courseCode, reviewer.title, reviewer.courseDescription]
    .map(normalizeCourseText)
    .filter(Boolean)

  return userCourses.some((userCourse) => reviewerCourses.some((reviewerCourse) => isMeaningfulCourseMatch(userCourse, reviewerCourse)))
}

export { isSameCourse }
