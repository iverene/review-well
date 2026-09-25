import { useState } from 'react'
import { Link } from 'react-router-dom'

import FlashcardDeck from './FlashcardDeck'
import BlurtingMode from './BlurtingMode'
import PomodoroDock from './PomodoroDock'
import PdfViewer from './PdfViewer'

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
  loginReturnTo = '/',
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
  const guestLoginHref = `/login?returnTo=${encodeURIComponent(loginReturnTo)}`

  return (
    <div aria-label="Study hub">
      {guest && (
        <p data-testid="study-guest-nudge">
          <Link to={guestLoginHref}>Sign in with Google to save this</Link>
        </p>
      )}

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
            <p data-testid="study-upload-banner">
              Please upload the source file to enable study modes
            </p>
          )}
          {!hasFile && !isOwner && (
            <p data-testid="study-no-source">No source file yet.</p>
          )}
          {fileType === 'pdf' && (
            <PdfViewer fileUrl={fileUrl} title={reviewer?.title} />
          )}
          {fileType === 'pptx' && (
            <iframe
              src={pptxEmbed}
              title="Source presentation"
              data-testid="study-source-pptx"
            />
          )}
          {hasFile && !fileType && (
            <a href={fileUrl} data-testid="study-source-link">
              Open source file
            </a>
          )}
        </div>
      )}

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
    </div>
  )
}

export default StudyTabs
