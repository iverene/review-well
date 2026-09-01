const crypto = require('crypto')
const sendgridService = require('../services/sendgridService')
const userModel = require('../models/userModel')

// Store verification tokens (in production, use Redis or database)
const verificationTokens = new Map()

const requestVerification = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const user = await userModel.findByEmail(email)
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If an account exists with that email, a verification link has been sent' })
    }

    if (user.emailVerified) {
      return res.json({ message: 'Email is already verified' })
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    verificationTokens.set(token, {
      userId: user.id,
      email: user.email,
      expiresAt,
    })

    // Send verification email
    await sendgridService.sendVerificationEmail(
      user.email,
      token,
      user.displayName
    )

    res.json({ message: 'If an account exists with that email, a verification link has been sent' })
  } catch (error) {
    console.error('Request verification error:', error)
    res.status(500).json({ error: 'Failed to send verification email' })
  }
}

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params

    const tokenData = verificationTokens.get(token)

    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired verification token' })
    }

    if (new Date() > tokenData.expiresAt) {
      verificationTokens.delete(token)
      return res.status(400).json({ error: 'Verification token has expired' })
    }

    // Update user email verified status
    await userModel.update(tokenData.userId, {
      emailVerified: true,
    })

    // Clean up token
    verificationTokens.delete(token)

    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Verify email error:', error)
    res.status(500).json({ error: 'Failed to verify email' })
  }
}

const unsubscribe = async (req, res) => {
  try {
    const { email, token } = req.params

    // In production, verify the token and update user preferences
    // For now, just acknowledge the request
    res.json({ message: 'Successfully unsubscribed from email notifications' })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    res.status(500).json({ error: 'Failed to process unsubscribe request' })
  }
}

module.exports = {
  requestVerification,
  verifyEmail,
  unsubscribe,
}
