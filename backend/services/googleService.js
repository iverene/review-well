import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const verifyGoogleToken = async (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid Google token')
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    return ticket.getPayload()
  } catch (error) {
    throw new Error('Invalid Google token', { cause: error })
  }
}

export const getGoogleUserInfo = async (token) => {
  const payload = await verifyGoogleToken(token)

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    avatar: payload.picture,
  }
}