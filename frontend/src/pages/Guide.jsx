import { BookOpen, FileUp, Globe2, Bookmark, Sparkles } from 'lucide-react'

const Guide = () => (
  <section className="mx-auto max-w-2xl py-8">
    <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold text-ink sm:text-3xl md:text-4xl">
      <BookOpen className="h-8 w-8" aria-hidden="true" /> Review Well Guide
    </h1>

    <div className="mt-6 space-y-6 leading-relaxed text-ink">
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><FileUp className="h-5 w-5" aria-hidden="true" /> 1. Create and Upload</h2>
        <p className="mt-1 text-muted">Start from Create, name your reviewer, and attach a PDF or PPTX (max 25 MB). Your file opens in the study hub next to everything built from it.</p>
      </section>
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Globe2 className="h-5 w-5" aria-hidden="true" /> 2. Discover Public Guides</h2>
        <p className="mt-1 text-muted">Browse public reviewers made by fellow students and start with the topics you need most.</p>
      </section>
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Bookmark className="h-5 w-5" aria-hidden="true" /> 3. Save and Share</h2>
        <p className="mt-1 text-muted">Bookmark the guides you love, follow creators to see their new reviewers, and flip your own reviewers public or unlisted to share them with a link.</p>
      </section>
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Sparkles className="h-5 w-5" aria-hidden="true" /> 4. Coming Soon</h2>
        <p className="mt-1 text-muted">AI flashcards, the Pomodoro technique, and blurting are on the way — your uploaded files will power them when they land.</p>
      </section>
    </div>
  </section>
)

export default Guide
