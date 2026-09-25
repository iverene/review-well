// Display labels for stored exam-type values (Create.jsx select options).
// Unknown or missing values pass through unchanged — never blank the UI.
const EXAM_TYPE_LABELS = {
  prelim: 'Prelim',
  midterm: 'Midterm',
  final: 'Finals',
}

export const formatExamType = (value) => EXAM_TYPE_LABELS[value] ?? value
