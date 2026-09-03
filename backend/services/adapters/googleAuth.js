import { OAuth2Client } from 'google-auth-library'

const createGoogleAuthAdapter = () => {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  const verifyIdToken = async (token) => {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      const payload = ticket.getPayload()
      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
      }
    } catch (error) {
      console.error('Google token verification failed:', error)
      throw new Error('Invalid Google token')
    }
  }

  return { verifyIdToken }
}

export { createGoogleAuthAdapter }
