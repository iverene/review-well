import { BookOpen, FileUp, Layers, MessagesSquare, Timer } from 'lucide-react'

const Guide = () => (
  <section className="mx-auto max-w-2xl py-8">
    <h1 className="mt-3 flex items-center gap-2 text-3xl font-extrabold text-ink md:text-4xl">
      <BookOpen className="h-8 w-8" aria-hidden="true" /> Review Well Guide
    </h1>

    <div className="mt-6 space-y-6 leading-relaxed text-ink">
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><FileUp className="h-5 w-5" aria-hidden="true" /> 1. Create and Upload</h2>
        <p className="mt-1 text-muted">Start from Create, name your reviewer, and attach a PDF or PPTX (max 25 MB). Your file opens in the study hub next to everything built from it.</p>
      </section>
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Layers className="h-5 w-5" aria-hidden="true" /> 2. Study the Flashcard Deck</h2>
        <p className="mt-1 text-muted">Generate an AI starter deck from your file (3 generations per rolling 7-day window), flip cards to test yourself, and mark the ones you know. Add, edit, or remove cards any time.</p>
      </section>
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><MessagesSquare className="h-5 w-5" aria-hidden="true" /> 3. Blurt It Out</h2>
        <p className="mt-1 text-muted">Pick a recall prompt, write everything you remember, and get an AI grade with feedback on what you missed — or rate yourself when the AI quota runs out.</p>
      </section>
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Timer className="h-5 w-5" aria-hidden="true" /> 4. Focus With Pomodoro</h2>
        <p className="mt-1 text-muted">Link a focus session to your reviewer, work in timed sprints, and build streaks toward your daily focus goal.</p>
      </section>
      <section>
        <h2 className="font-display text-xl font-bold">5. Share and Save</h2>
        <p className="mt-1 text-muted">Flip a reviewer public or unlisted to share it with a link, save guides you love, and follow friends to see their new reviewers.</p>
      </section>
    </div>
  </section>
)

export default Guide
