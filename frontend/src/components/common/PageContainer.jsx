const PageContainer = ({ children, className = '' }) => (
  <div className={`mx-auto w-full max-w-5xl pb-10${className ? ` ${className}` : ''}`}>{children}</div>
)

export default PageContainer
