import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronRight, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'

const Settings = () => {
  const { user, logout } = useAuth()
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
        <h2 className="font-display text-xl font-bold text-ink">Account</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-powder" aria-hidden="true">
              <Mail className="h-4 w-4 text-ink" />
            </span>
            <span>
              <span className="block text-xs font-extrabold uppercase tracking-widest text-muted">Signed in as</span>
              <span className="block text-sm font-bold text-ink">{user?.email}</span>
            </span>
          </div>
          <Link
            to="/settings/account"
            className="flex items-center gap-3 rounded-soft px-2 py-2 text-sm font-extrabold text-ink hover:bg-powder"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-powder" aria-hidden="true">
              <UserRound className="h-4 w-4 text-ink" />
            </span>
            <span className="flex-1">Account information</span>
            <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
          </Link>
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
