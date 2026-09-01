const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const userModel = require('../models/userModel')

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
          callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const { id, displayName, emails, photos } = profile
            const email = emails[0].value
            const avatar = photos[0]?.value

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
      )
    )
  }
}

module.exports = { configurePassport }
