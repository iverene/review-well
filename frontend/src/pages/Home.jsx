function Home() {
  return (
    <div>
      <h2 className="text-4xl font-semibold text-ink mb-4">
        Academic Study Guides
      </h2>
      <p className="text-muted mb-8">
        Create, remix, and review study materials from any source.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-stone p-6">
          <h3 className="text-xl font-semibold mb-2">Create Reviewer</h3>
          <p className="text-muted">Upload notes, paste URLs, or import YouTube transcripts</p>
        </div>
        <div className="border border-stone p-6">
          <h3 className="text-xl font-semibold mb-2">Browse Public</h3>
          <p className="text-muted">Discover study guides shared by the community</p>
        </div>
      </div>
    </div>
  )
}

export default Home
