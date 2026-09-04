const PageContainer = ({ children, className = '' }) => (
  <div className={`mx-auto w-full max-w-5xl px-4 pb-10 md:px-6${className ? ` ${className}` : ''}`}>{children}</div>
)

export default PageContainer
