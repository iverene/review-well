const WorkspaceLoading = () => (
  <div
    className="flex h-full w-full flex-col items-center justify-center gap-4"
    style={{ width: '100vw', height: '100vh', background: '#F8F9FA', fontFamily: "'Nunito', sans-serif" }}
    role="status"
    aria-label="Loading your study desk"
  >
    <img
      src="/logo.png"
      alt="Review Well"
      className="desk-bob h-20 w-20 rounded-2xl object-contain shadow-sm"
    />
    <img
      src="/word-logo.png"
      alt="Review Well"
      className="desk-fade h-8 w-auto max-w-[220px] object-contain"
    />
    <p className="text-sm font-bold text-gray-500">
      Preparing your study desk<span className="desk-dots" aria-hidden="true" />
    </p>
  </div>
)

export default WorkspaceLoading
