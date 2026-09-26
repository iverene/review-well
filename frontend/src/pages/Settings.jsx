import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronRight, LogOut, Moon, Palette, ShieldCheck, Sun, UserRound } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const THEME_META = {
  light: { label: 'Light', description: 'Bright paper with cocoa ink.', Icon: Sun },
  dark: { label: 'Dark', description: 'Easy on the eyes at night.', Icon: Moon },
  reading: { label: 'Reading', description: 'Warm sepia for long sessions.', Icon: Palette },
}

const Settings = () => {
  const { logout } = useAuth()
  const { theme, setTheme, themes } = useTheme()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logout()
      navigate('/login')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <h1 className="mt-1 font-display text-3xl font-bold text-ink md:text-4xl">
        Settings
      </h1>

      <section className="mt-4 rounded-soft border-2 border-stone bg-paper p-6 club-shadow" aria-label="Account">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <UserRound className="h-5 w-5 text-accent" aria-hidden="true" /> Account
        </h2>
        <div className="mt-3 flex flex-col gap-1 text-sm font-bold">
          <Link to="/settings/account" className="flex items-center gap-2 rounded-soft px-2 py-2 text-ink hover:bg-powder">
            <span className="flex-1">Account Information</span>
            <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-soft border-2 border-stone bg-paper p-6 club-shadow" aria-label="Appearance">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <Palette className="h-5 w-5 text-accent" aria-hidden="true" /> Appearance
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
          {themes.map((value) => {
            const { label, description, Icon } = THEME_META[value]
            const selected = theme === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-start gap-1 rounded-soft border-2 p-3 text-left transition-colors ${selected ? 'border-accent bg-blush/40' : 'border-stone hover:bg-stone/20'}`}
              >
                <span className="inline-flex items-center gap-2 text-sm font-extrabold text-ink">
                  <Icon className="h-4 w-4 text-accent" aria-hidden="true" /> {label}
                </span>
                <span className="text-xs font-semibold text-muted">{description}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-4 rounded-soft border-2 border-stone bg-paper p-6 club-shadow" aria-label="Legal">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" /> Legal
        </h2>
        <div className="mt-3 flex flex-col gap-1 text-sm font-bold">
          <Link to="/privacy" className="rounded-soft px-2 py-2 text-ink hover:bg-powder">Privacy Policy</Link>
          <Link to="/terms" className="rounded-soft px-2 py-2 text-ink hover:bg-powder">Terms and Conditions</Link>
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-blush disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}

export default Settings
