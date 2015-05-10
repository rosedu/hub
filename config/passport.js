var GoogleStrategy   = require('passport-google-plus')

var User     = require('./models/user').user
var Role     = require('./models/user').role
var Activity = require('./models/activity').activity

// load the auth variables
var configAuth = require('./auth')

module.exports = function(passport) {
  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  })
  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    })
  })


  // GOOGLE LOGIN
  passport.use(new GoogleStrategy({
    clientId        : configAuth.googleAuth.clientID,
    clientSecret    : configAuth.googleAuth.clientSecret

  }, function(tokens, profile, done) {
    process.nextTick(function() {
      User.findOne({'google.id' : profile.id}, function(err, user) {
        if (err) return done(err)

        if (user) {
          user.google.token = tokens.access_token
          user.google.name  = profile.displayName
          user.google.email = profile.email
          user.google.avatar = profile.image.url.split('?')[0]

          user.save(function(err) {
            if (err) throw err
            return done(null, user, tokens)
          })

        } else {
          var newUser          = new User()

          newUser.google.id    = profile.id
          newUser.google.token = tokens.access_token
          newUser.google.name  = profile.displayName
          newUser.google.email = profile.email
          newUser.google.avatar = profile.image.url.split('?')[0]

          newUser.save(function(err) {
            if (err) throw err

            // Add all the roles which the current user had, to his profile
            Activity.find().exec(function(err, all) {
              all.forEach(function(act) {
                act.edition.forEach(function(ed) {
                  ed.people.forEach(function(peep) {
                    var name = peep.split(':')[0]
                    var role = peep.split(':')[1]

                    if (name == profile.displayName) {
                      var role = new Role({
                        'activityId' : act._id,
                        'editionId'  : ed._id,
                        'role'       : role
                      })

                      var query = {'google.email': profile.email}
                      var update = {$push: {'jobs': role}}
                      User.update(query, update).exec()
                    }
                  })
                })
              })
            })

            return done(null, newUser, tokens)
          })
        }

      })
    })
  }))

}