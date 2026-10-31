import { lazy, Suspense, useState } from 'react'
import { FileUp } from 'lucide-react'

import Button from './common/Button'
import EmptyState from './common/EmptyState'

// pdf.js is ~470 kB minified, so the viewer loads on demand instead of
// riding in the Reviewer route chunk. The parked study modes stay out of the
// bundle until they are re-enabled.
const loadPdfViewer = () => import('./PdfViewer')
const PdfViewer = lazy(loadPdfViewer)
const FlashcardDeck = lazy(() => import('./FlashcardDeck'))
const BlurtingMode = lazy(() => import('./BlurtingMode'))
const PomodoroDock = lazy(() => import('./PomodoroDock'))

// Start fetching the viewer while the reviewer detail request is in flight,
// so the two downloads overlap instead of running back to back.
export const preloadPdfViewer = () => {
  loadPdfViewer().catch(() => {
    // Offline or a stale deploy: the lazy boundary retries on render.
  })
}

// Same footprint as the viewer frame so swapping it in causes no layout shift.
const PdfViewerFallback = () => (
  <div className="overflow-hidden rounded-soft border-2 border-stone bg-paper" role="status" aria-label="Loading document">
    <div className="h-12 border-b-2 border-stone bg-cream" />
    <div className="h-[62vh] animate-pulse bg-cream/50 md:h-[72vh]" />
  </div>
)

const TABS = [
  { value: 'source', label: 'Source' },
  { value: 'flashcards', label: 'Flashcards' },
  { value: 'blurting', label: 'Blurting' },
]

// Study modes visible in the hub. Flashcards, blurting, and Pomodoro are
// parked for now — flip them back on here to re-enable (components, API,
// and tests are intact).
const ENABLED_STUDY_MODES = ['source']

const fileTypeFromUrl = (url) => {
  if (!url) return null
  const clean = String(url).split('?')[0].toLowerCase()
  if (clean.endsWith('.pdf')) return 'pdf'
  if (clean.endsWith('.pptx') || clean.endsWith('.ppt')) return 'pptx'
  return null
}

// Study hub: Source viewer today (PDF iframe / PPTX Office-viewer embed).
// Flashcards, Blurting, and the Pomodoro dock render only when listed in
// ENABLED_STUDY_MODES. Data arrives as props (no fetching inside); guests run
// fully local-only — persistent affordances point at /login?returnTo=...
// instead of writing.
const StudyTabs = ({
  reviewer,
  cards = [],
  guest = false,
  gradesLeft,
  decksLeft,
  isOwner = false,
  onToggleKnown = () => {},
  onAdd = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onGenerate,
  onBlurtingSubmit = () => {},
  onBlurtingRate = () => {},
}) => {
  const [tab, setTab] = useState('source')
  const tabs = TABS.filter(({ value }) => ENABLED_STUDY_MODES.includes(value))

  const fileUrl = reviewer?.fileUrl || null
  const fileType = fileTypeFromUrl(fileUrl)
  const hasFile = !!fileUrl
  const prompts = Array.isArray(reviewer?.prompts) ? reviewer.prompts : []
  const prompt = prompts.length > 0 ? prompts[0] : null
  const pptxEmbed = fileType === 'pptx' && fileUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
    : null

  return (
    <div aria-label="Study hub">

      {tabs.length > 1 && (
        <div role="tablist" aria-label="Study modes">
          {tabs.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === 'source' && (
        <div role="tabpanel" aria-label="Source">
          {!hasFile && isOwner && (
            <div data-testid="study-upload-banner">
              <EmptyState
                title="Add your source file"
                action={(
                  <Button to={`/create?edit=${reviewer?.id}`} variant="primary">
                    <FileUp className="h-4 w-4" aria-hidden="true" /> Upload a PDF or PPTX
                  </Button>
                )}
              >
                Upload your slides so you and your classmates can study from them here.
              </EmptyState>
            </div>
          )}
          {!hasFile && !isOwner && (
            <div data-testid="study-no-source">
              <EmptyState title="No source file yet">
                The creator hasn’t uploaded slides for this reviewer. Check back soon.
              </EmptyState>
            </div>
          )}
          {fileType === 'pdf' && (
            <Suspense fallback={<PdfViewerFallback />}>
              <PdfViewer fileUrl={fileUrl} title={reviewer?.title} />
            </Suspense>
          )}
          {fileType === 'pptx' && (
            <iframe
              src={pptxEmbed}
              title="Source presentation"
              data-testid="study-source-pptx"
              loading="lazy"
              allowFullScreen
              className="block aspect-video max-h-[72vh] w-full rounded-soft border-2 border-stone bg-paper"
            />
          )}
          {hasFile && !fileType && (
            <Button href={fileUrl} data-testid="study-source-link" target="_blank" rel="noopener noreferrer">
              Open source file
            </Button>
          )}
        </div>
      )}

      <Suspense fallback={null}>
      {tab === 'flashcards' && ENABLED_STUDY_MODES.includes('flashcards') && (
        <div role="tabpanel" aria-label="Flashcards">
          <FlashcardDeck
            cards={cards}
            guest={guest}
            onToggleKnown={onToggleKnown}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            remaining={decksLeft}
            onGenerate={onGenerate}
          />
        </div>
      )}

      {tab === 'blurting' && ENABLED_STUDY_MODES.includes('blurting') && (
        <div role="tabpanel" aria-label="Blurting">
          {prompt ? (
            <BlurtingMode
              prompt={prompt}
              guest={guest}
              gradesLeft={gradesLeft}
              onSubmit={onBlurtingSubmit}
              onRate={onBlurtingRate}
            />
          ) : (
            <p data-testid="study-no-prompt">No blurting prompt yet.</p>
          )}
        </div>
      )}

      {ENABLED_STUDY_MODES.includes('pomodoro') && (
        <PomodoroDock reviewerId={reviewer?.id} guest={guest} />
      )}
      </Suspense>
    </div>
  )
}

export default StudyTabs
