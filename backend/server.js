const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const hpp = require('hpp')
const passport = require('passport')
const { sessionConfig } = require('./config/session')
const { configurePassport } = require('./config/googleOAuth')

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
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/reviewers', require('./routes/reviewerRoutes'))
app.use('/api/ai', require('./routes/aiRoutes'))
app.use('/api/social', require('./routes/socialRoutes'))
app.use('/api/email', require('./routes/emailRoutes'))

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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = app
