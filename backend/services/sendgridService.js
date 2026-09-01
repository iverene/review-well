const sgMail = require('@sendgrid/mail')
const { verificationTemplate, welcomeTemplate, notificationTemplate } = require('./templates/email')

class SendGridService {
  constructor() {
    this.initialized = false
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@reviewwell.app'
  }

  init() {
    if (this.initialized) return

    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      this.initialized = true
      console.log('SendGrid initialized')
    } else {
      console.warn('SendGrid API key not configured, emails will be logged')
    }
  }

  async send(msg) {
    this.init()

    if (!this.initialized) {
      console.log('Email would be sent:', {
        to: msg.to,
        subject: msg.subject,
      })
      return { statusCode: 200, message: 'Email logged (not configured)' }
    }

    try {
      const response = await sgMail.send(msg)
      return { statusCode: response[0].statusCode }
    } catch (error) {
      console.error('SendGrid error:', error.response?.body || error.message)
      throw new Error('Failed to send email')
    }
  }

  async sendVerificationEmail(email, token, displayName) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`
    const template = verificationTemplate(displayName, verificationUrl)

    return this.send({
      to: email,
      from: this.fromEmail,
      subject: 'Verify your Review Well account',
      html: template,
    })
  }

  async sendWelcomeEmail(email, displayName) {
    const template = welcomeTemplate(displayName)

    return this.send({
      to: email,
      from: this.fromEmail,
      subject: 'Welcome to Review Well!',
      html: template,
    })
  }

  async sendLikeNotification(email, actorName, reviewerTitle) {
    const template = notificationTemplate(
      'like',
      actorName,
      reviewerTitle
    )

    return this.send({
      to: email,
      from: this.fromEmail,
      subject: `${actorName} liked your reviewer`,
      html: template,
    })
  }

  async sendFollowNotification(email, actorName) {
    const template = notificationTemplate(
      'follow',
      actorName
    )

    return this.send({
      to: email,
      from: this.fromEmail,
      subject: `${actorName} started following you`,
      html: template,
    })
  }

  isConfigured() {
    return !!process.env.SENDGRID_API_KEY
  }
}

module.exports = new SendGridService()
