const sgMail = require('@sendgrid/mail')

const createSendGridAdapter = () => {
  const init = () => {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    }
  }

  const send = async ({ to, subject, html, text }) => {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('SendGrid not configured, skipping email:', { to, subject })
      return { statusCode: 200, message: 'Email skipped (not configured)' }
    }

    try {
      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@reviewwell.app',
        subject,
        html,
        text,
      }
      const response = await sgMail.send(msg)
      return { statusCode: response[0].statusCode }
    } catch (error) {
      console.error('SendGrid error:', error)
      throw new Error('Failed to send email')
    }
  }

  const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`
    return send({
      to: email,
      subject: 'Verify your Review Well account',
      html: `
        <h1>Welcome to Review Well!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    })
  }

  const sendWelcomeEmail = async (email, name) => {
    return send({
      to: email,
      subject: 'Welcome to Review Well!',
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for joining Review Well. Start creating your first study guide today!</p>
      `,
    })
  }

  init()

  return { send, sendVerificationEmail, sendWelcomeEmail }
}

module.exports = { createSendGridAdapter }
