import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Keyboard, Printer, Sparkles } from 'lucide-react'

const Guide = () => (
  <section className="mx-auto max-w-2xl py-8">
    <Link to="/" className="mb-3 inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to desk
    </Link>
    <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">How it works</p>
    <h1 className="mt-3 flex items-center gap-2 text-4xl font-extrabold text-ink">
      <BookOpen className="h-8 w-8" aria-hidden="true" /> Review Well guide
    </h1>

    <div className="mt-6 space-y-6 leading-relaxed text-ink">
      <section>
        <h2 className="font-display text-xl font-bold">1. Name your deck</h2>
        <p className="mt-1 text-muted">Rename your reviewer from the top document bar. The subtitle shows the examination period and semester.</p>
      </section>
      <section>
        <h2 className="font-display text-xl font-bold">2. Insert structure</h2>
        <p className="mt-1 text-muted">Use Insert to add a Blank Page, Lesson banners, Main Topics, Sub-Topics, Terms and Definitions Cards, tables, images, and horizontal lines. New elements always appear directly below the previous one.</p>
      </section>
      <section>
        <h2 className="font-display text-xl font-bold">3. Edit inline</h2>
        <p className="mt-1 text-muted">Click any sheet element to edit it in place. Clicking a block opens a quick menu with Copy, Paste, Duplicate, and Delete. Double-click the top or bottom margin of a page to edit its header or footer.</p>
      </section>
      <section>
        <h2 className="font-display text-xl font-bold">4. Format</h2>
        <p className="mt-1 text-muted">Use Format to switch themes, toggle 1-column or 2-column layout, and pick a paper size (Letter, A4, Legal).</p>
      </section>
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Sparkles className="h-5 w-5" aria-hidden="true" /> 5. AI Extract</h2>
        <p className="mt-1 text-muted">Press AI Extract and upload a .pdf or .pptx to auto-structure notes into the sheet.</p>
      </section>
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Keyboard className="h-5 w-5" aria-hidden="true" /> 6. Shortcuts</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
          <li>Ctrl + B / I / U — Bold / Italic / Underline</li>
          <li>Ctrl + Z — Undo · Ctrl + Y — Redo</li>
          <li>Ctrl + S — Save · Ctrl + A — Select the document body</li>
          <li>Ctrl + Alt + L — Insert a Lesson · Ctrl + Alt + M — Main Topic · Ctrl + Alt + S — Sub-Topic</li>
        </ul>
      </section>
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Printer className="h-5 w-5" aria-hidden="true" /> 7. Print or save</h2>
        <p className="mt-1 text-muted">File then Save as PDF downloads the sheets as a PDF file. File then Print sends only the white sheets to the printer.</p>
      </section>
    </div>
  </section>
)

export default Guide
