import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import hpp from 'hpp'
import { pathToFileURL } from 'url'
import passport from 'passport'
import { sessionConfig } from './config/session.js'
import { configurePassport } from './config/googleOAuth.js'

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(hpp())

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Session
app.use(sessionConfig)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())
configurePassport()

// Routes
app.use('/api/auth', (await import('./routes/authRoutes.js')).default)
app.use('/api/reviewers', (await import('./routes/reviewerRoutes.js')).default)
app.use('/api/ai', (await import('./routes/aiRoutes.js')).default)
app.use('/api/social', (await import('./routes/socialRoutes.js')).default)
app.use('/api/profile', (await import('./routes/profileRoutes.js')).default)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export default app