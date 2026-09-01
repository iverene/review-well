const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Courier New', monospace; background-color: #F5F5F0; color: #1A1A1A; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { border-bottom: 2px solid #1A1A1A; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #1A1A1A; }
    .content { line-height: 1.6; }
    .button { display: inline-block; background-color: #1A1A1A; color: #F5F5F0; padding: 12px 24px; text-decoration: none; border: none; cursor: pointer; }
    .button:hover { background-color: #434343; }
    .footer { border-top: 1px solid #D9D9D9; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Review Well</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Review Well - Academic Study Guide Platform</p>
      <p>If you didn't request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>
`

const verificationTemplate = (displayName, verificationUrl) => baseTemplate(`
  <h1>Verify your email address</h1>
  <p>Hi ${displayName || 'there'},</p>
  <p>Thanks for signing up for Review Well! Please verify your email address by clicking the button below:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${verificationUrl}" class="button">Verify Email</a>
  </p>
  <p>This link will expire in 24 hours.</p>
  <p>If you didn't create an account, you can safely ignore this email.</p>
`)

const welcomeTemplate = (displayName) => baseTemplate(`
  <h1>Welcome to Review Well!</h1>
  <p>Hi ${displayName || 'there'},</p>
  <p>Welcome to Review Well! We're excited to have you join our community of learners.</p>
  <p>Here's what you can do with Review Well:</p>
  <ul>
    <li>Create interactive study guides from your lecture notes</li>
    <li>Use AI to automatically extract key concepts and terms</li>
    <li>Organize your study materials with a clean, distraction-free editor</li>
    <li>Share your study guides with classmates</li>
  </ul>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/create" class="button">Create Your First Reviewer</a>
  </p>
  <p>Happy studying!</p>
`)

const notificationTemplate = (type, actorName, reviewerTitle) => {
  let content = ''

  switch (type) {
    case 'like':
      content = `
        <h1>Your reviewer got a like!</h1>
        <p>Hi there,</p>
        <p><strong>${actorName}</strong> liked your reviewer "${reviewerTitle || 'your study guide'}".</p>
        <p>Your work is being appreciated! Keep creating great study materials.</p>
      `
      break
    case 'follow':
      content = `
        <h1>You have a new follower!</h1>
        <p>Hi there,</p>
        <p><strong>${actorName}</strong> started following you.</p>
        <p>They'll be notified when you create new public study guides.</p>
      `
      break
    default:
      content = `
        <h1>Notification from Review Well</h1>
        <p>Hi there,</p>
        <p>You have a new notification.</p>
      `
  }

  return baseTemplate(content)
}

module.exports = {
  baseTemplate,
  verificationTemplate,
  welcomeTemplate,
  notificationTemplate,
}
