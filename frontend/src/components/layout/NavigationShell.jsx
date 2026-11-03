import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import NotificationBadge from '../notifications/NotificationBadge'
import AvatarDropdown from '../auth/AvatarDropdown'
import LoginButton from '../auth/LoginButton'
import Button from '../common/Button'

import BottomDock from './BottomDock'

// Header search hands off to the public library, which runs the query.
const HeaderSearch = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/reviewer/public?q=${encodeURIComponent(q)}` : '/reviewer/public')
  }

  return (
    <form role="search" onSubmit={submit} className="hidden min-w-0 flex-1 sm:flex">
      <label htmlFor="header-search" className="sr-only">Search reviewers</label>
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id="header-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a reviewer or course"
          className="w-full rounded-full border border-line bg-cream py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-muted focus:border-accent focus:bg-paper focus:outline-none"
        />
      </div>
    </form>
  )
}

// Soft Pop shell: a light header on top and a floating pill dock at the
// bottom on every screen size, so navigation sits in the same place on
// phones and desktops.
const NavigationShell = ({ children }) => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="relative flex h-screen flex-col bg-page">
      <header className="z-40 shrink-0 border-b border-stone/70 bg-page/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-5 md:px-8">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Review Well home">
            <img src="/logo.webp" alt="" width="192" height="192" className="h-9 w-9 object-contain" />
            <img src="/word-logo.webp" alt="Review Well" width="430" height="112" className="wordmark ml-2 h-6 w-auto max-w-[130px] object-contain sm:max-w-none" />
          </Link>
          {isAuthenticated && <HeaderSearch />}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <Button to="/create" variant="primary" className="hidden md:inline-flex">
                  <Plus className="h-4 w-4" aria-hidden="true" /> New reviewer
                </Button>
                <NotificationBadge />
                <AvatarDropdown />
              </>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className={`relative flex-1 overflow-y-auto show-scroll ${isAuthenticated ? 'pb-32' : 'pb-8'}`}>{children}</main>

      {isAuthenticated && <BottomDock />}
    </div>
  )
}

export default NavigationShell
