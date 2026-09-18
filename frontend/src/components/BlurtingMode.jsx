import { useState } from 'react'

const RATINGS = [
  { value: 'missed', label: 'Missed' },
  { value: 'partial', label: 'Partial' },
  { value: 'nailed', label: 'Nailed' },
]

// Presentational blurting mode: prompt and quota come in as props (no data
// fetching inside). onSubmit(dumpText) resolves to the POST response shape
// ({ gradedVia: 'ai' | 'self', ... }); onRate(attemptId, rating) persists a
// self-rating via PATCH. Guests run fully in-memory: submit never calls
// onSubmit so no rows are created.
const BlurtingMode = ({
  prompt,
  guest = false,
  gradesLeft,
  onSubmit = () => {},
  onRate = () => {},
}) => {
  const [dump, setDump] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [rated, setRated] = useState(null)

  const effectiveGradesLeft = result && result.gradesLeft !== undefined
    ? result.gradesLeft
    : gradesLeft
  const exhausted = effectiveGradesLeft === 0

  const handleSubmit = async () => {
    if (!dump.trim() || submitting) return
    if (guest) {
      setResult({ gradedVia: 'self', local: true, dumpText: dump.trim() })
      setRated(null)
      setError(null)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const response = await onSubmit(dump.trim())
      setResult(response)
      setRated(null)
    } catch (submitError) {
      setError(submitError?.message || 'Submission failed — please retry.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRate = (rating) => {
    setRated(rating)
    if (!result?.local && result?.attemptId) {
      onRate(result.attemptId, rating)
    }
  }

  const reset = () => {
    setDump('')
    setResult(null)
    setRated(null)
    setError(null)
  }

  const ratingLabel = RATINGS.find((rating) => rating.value === rated)?.label

  return (
    <div aria-label="Blurting mode">
      {guest && (
        <p data-testid="blurting-guest-banner">
          Sign in with Google to save progress
        </p>
      )}

      {typeof effectiveGradesLeft === 'number' && (
        <p data-testid="blurting-counter">
          {effectiveGradesLeft}/5 AI reviews left
        </p>
      )}
      {(exhausted || result?.notice) && (
        <p data-testid="blurting-exhausted-notice">
          {result?.notice || 'AI feedback limit reached — self-review mode'}
        </p>
      )}

      {result === null ? (
        <div>
          <p data-testid="blurting-prompt">{prompt}</p>
          <label htmlFor="blurting-dump">Your recall</label>
          <textarea
            id="blurting-dump"
            value={dump}
            onChange={(event) => setDump(event.target.value)}
          />
          {error && <p role="alert">{error}</p>}
          <button
            type="button"
            aria-label="Submit recall"
            onClick={handleSubmit}
            disabled={!dump.trim() || submitting}
          >
            Submit recall
          </button>
        </div>
      ) : (
        <div data-testid="blurting-result">
          {result.gradedVia === 'ai' ? (
            <div data-testid="blurting-ai-result">
              <p data-testid="blurting-score">{result.aiScore}/10</p>
              <p>{result.aiFeedback}</p>
              {Array.isArray(result.missedPoints) && result.missedPoints.length > 0 && (
                <ul aria-label="Missed points">
                  {result.missedPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div data-testid="blurting-self-result">
              <div>
                <h3>Your recall</h3>
                <p data-testid="blurting-dump-echo">{result.dumpText || dump.trim()}</p>
              </div>
              {(result.sourceExcerpt || (result.local && prompt)) && (
                <div>
                  <h3>Reference</h3>
                  <p>{result.sourceExcerpt || prompt}</p>
                </div>
              )}
              {Array.isArray(result.keyPoints) && result.keyPoints.length > 0 && (
                <ul aria-label="Key points">
                  {result.keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
              <div>
                {RATINGS.map((rating) => (
                  <button
                    key={rating.value}
                    type="button"
                    aria-label={rating.label}
                    aria-pressed={rated === rating.value}
                    onClick={() => handleRate(rating.value)}
                  >
                    {rating.label}
                  </button>
                ))}
              </div>
              {rated && (
                <p data-testid="blurting-rating-confirmation">
                  {ratingLabel} — {result.local ? 'nice work.' : 'saved.'}
                </p>
              )}
            </div>
          )}
          <button type="button" aria-label="Try again" onClick={reset}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

export default BlurtingMode
