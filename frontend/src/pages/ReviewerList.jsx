import { useEffect, useState } from 'react'
import axios from 'axios'
import { BookOpen, LibraryBig } from 'lucide-react'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'

const ReviewerList = ({ mine = false }) => {
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadReviewers = async () => {
      try {
        const response = await axios.get(mine ? '/api/reviewers/my' : '/api/reviewers/public', { withCredentials: mine })
        setReviewers(response.data.reviewers || [])
      } catch (loadError) {
        console.error('Failed to load reviewer list:', loadError)
        setError(getApiErrorMessage(loadError, 'Unable to load reviewers.'))
      } finally {
        setLoading(false)
      }
    }
    loadReviewers()
  }, [mine])

  const title = mine ? 'My Reviewers' : 'Public Reviewers'
  const Icon = mine ? LibraryBig : BookOpen

  return (
    <section className="space-y-6 pb-8">
      <div><p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">{mine ? 'Your library' : 'Community library'}</p><h1 className="mt-2 font-display text-4xl font-bold text-ink">{title}</h1><p className="mt-2 text-muted">{mine ? 'Your personal collection of study guides.' : 'Study guides shared by the Review Well community.'}</p></div>
      <ErrorAlert>{error}</ErrorAlert>
      {loading ? <p className="text-muted">Loading reviewers...</p> : reviewers.length === 0 ? <p className="rounded-soft border-2 border-dashed border-stone px-5 py-10 text-center text-muted">No reviewers here yet.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reviewers.map((reviewer) => <a key={reviewer.id} href={`/reviewer/${reviewer.id}`} className="group relative overflow-hidden rounded-soft border-2 border-stone bg-paper p-5 transition-transform hover:-translate-y-1"><span className="absolute inset-y-0 left-0 w-2 bg-mint group-hover:bg-powder" /><div className="pl-2"><div className="flex items-start justify-between gap-3"><h2 className="font-display text-lg font-bold text-ink">{reviewer.title}</h2><Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" /></div><p className="mt-2 text-sm font-semibold text-muted">{reviewer.courseCode}</p><p className="mt-5 text-xs text-muted">{reviewer._count?.likes || 0} likes</p></div></a>)}</div>}
    </section>
  )
}

export default ReviewerList
