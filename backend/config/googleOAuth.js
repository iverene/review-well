import passport from 'passport'
import GoogleStrategy from 'passport-google-oauth20'
import * as userModel from '../models/userModel.js'
import { getGoogleCallbackUrl } from './urls.js'

const verifyGoogleUser = async (accessToken, refreshToken, profile, done) => {
  try {
    const { id, displayName, emails, photos } = profile
    const email = emails?.[0]?.value
    if (!email) {
      return done(new Error('Google account did not provide an email address'))
    }
    const avatar = photos?.[0]?.value

    let user = await userModel.findByGoogleId(id)

    if (!user) {
      user = await userModel.create({
        googleId: id,
        email,
        displayName,
        avatarUrl: avatar,
      })
    } else if (user.email !== email || user.displayName !== displayName || user.avatarUrl !== avatar) {
      user = await userModel.update(user.id, {
        email,
        displayName,
        avatarUrl: avatar,
      })
    }

    done(null, user)
  } catch (error) {
    done(error, null)
  }
}

const configurePassport = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userModel.findById(id)
      done(null, user)
    } catch (error) {
      done(error, null)
    }
  })

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: getGoogleCallbackUrl(),
          scope: ['profile', 'email'],
          // CSRF protection: Google returns this state, verified from the session
          state: true,
        },
        verifyGoogleUser
      )
    )
  }
}

export { configurePassport, verifyGoogleUser }