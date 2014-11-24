// load all the things we need
var GoogleStrategy   = require('passport-google').Strategy;

// load up the user model
var User = require('./models/user')

// load the auth variables
var configAuth = require('./auth');

module.exports = function(passport) {

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });


    // GOOGLE
    passport.use(new GoogleStrategy({
        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        returnURL       : configAuth.googleAuth.callbackURL,
        passReqToCallback : true,
    },

    function(req, token, refreshToken, profile, done) {
        process.nextTick(function() {

            // Build user full name
            fullname = req.query['openid.ext1.value.firstname'] + ' '
            fullname += req.query['openid.ext1.value.lastname']

            // check if the user is already logged in
            if (!req.user) {
                User.findOne({'google.id' : profile.id}, function(err, user) {
                    if (err) return done(err);

                    if (user) {
                        if (!user.google.token) {
                            // HACK: use query data
                            user.google.token = req.query['openid.sig'];
                            user.google.name  = fullname;
                            user.google.email = req.query['openid.ext1.value.email']; // pull the first email

                            user.save(function(err) {
                                if (err) throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser          = new User();

                        newUser.google.id    = req.query['openid.sig'];
                        newUser.google.token = req.query['openid.sig'];
                        newUser.google.name  = fullname
                        newUser.google.email = req.query['openid.ext1.value.email']; // pull the first email

                        newUser.save(function(err) {
                            if (err) throw err;
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user = req.user;

                user.google.id = req.query['openid.sig'];
                user.google.token = token;
                user.google.name  = fullname;
                user.google.email = req.query['openid.ext1.value.email'];

                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });
    }));

};