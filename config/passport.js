var GoogleStrategy   = require('passport-google-plus')

var User     = require('./models/user').user
var Role     = require('./models/user').role
var Activity = require('./models/activity').activity

// load the auth variables
var configAuth = require('./auth')

module.exports = function(passport) {
  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id)
  })
  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user)
    })
  })


  // GOOGLE LOGIN
  passport.use(new GoogleStrategy({
    clientId          : configAuth.googleAuth.clientID,
    clientSecret      : configAuth.googleAuth.clientSecret,
    passReqToCallback : true

  }, function(req, tokens, profile, done) {
    process.nextTick(function() {
      User.findOne({'google.id' : profile.id}, function(err, user) {
        if (err) return done(err)

        if (user) {
          user.google.token  = tokens.access_token
          user.google.name   = profile.displayName
          user.google.email  = profile.email
          user.google.avatar = profile.image.url.split('?')[0]

          user.save(function(err) {
            if (err) console.log('Failed to login user: ' + err)
          })

        } else {
          user               = new User()
          user.google.id     = profile.id
          user.google.token  = tokens.access_token
          user.google.name   = profile.displayName
          user.google.email  = profile.email
          user.google.avatar = profile.image.url.split('?')[0]

          user.save(function(err) {
            if (err) console.log('Failed to register new user')
          })
        }
        return done(null, user)
      })
    })
  }))

}
