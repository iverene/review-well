function Layout({ children }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-stone px-6 py-4">
        <h1 className="text-2xl font-bold text-ink">
          <a href="/">Review Well</a>
        </h1>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
