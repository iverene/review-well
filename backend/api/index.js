// Vercel serverless entrypoint: re-exports the Express app.
// server.js only calls app.listen() when run directly, so importing it here
// is side-effect free and each invocation gets the configured app.
import app from '../server.js'

export default app
