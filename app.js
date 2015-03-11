var fs           = require('fs');
var express      = require('express');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose     = require('mongoose')
var app = module.exports = express();


// Connect to database
var configDB = require('./config/database.js')
mongoose.connect(configDB.url);


// Configuring Passport
var passport = require('passport');
require('./config/passport')(passport)
var expressSession = require('express-session');

app.use(expressSession({
  cookie: { maxAge: 1800000 }, //30 min
  secret: 'mySecretKey',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/public', express.static(__dirname + '/public'));
app.use('/bower', express.static(__dirname + '/bower_components'));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


// if NODE_ENV environment variable is set to 'development' then anyone can
// access the full features of the site, so doesn't need to be a ROSEdu member
var email_suffix = (process.env.NODE_ENV === 'development') ? '@gmail.com' : '@rosedu.org'

app.post('/auth/google/callback', passport.authenticate('google'), function(req, res) {
    // Init session vars
    profile = req.user.google
    isMember = (profile.email.indexOf(email_suffix) > -1) ? true:false

    req.session.user = {}
    req.session.user.id = profile.id
    req.session.user.name = profile.name
    req.session.user.email = profile.email
    req.session.user.token = profile.token
    req.session.user.isMember = isMember

    // Redirect to index page from ajax
    res.send("/")
});

app.get('/logout', function(req, res) {

    // Revoke token
    var https = require('https');
    https.get({
        host: 'accounts.google.com',
        path: '/o/oauth2/revoke?token=' + req.session.user.token
    }, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) { body += d; });
        response.on('end', function() {
          // We do not expect any response
          // Passport logout
          req.session.destroy()

          res.redirect('/')
        });
    });
});

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();
  // if they aren't redirect them to the home page
  res.redirect('/');
}

// route middleware to make sure a user is member
function isMember(req, res, next) {

  if (!req.user) {
    res.render('errors', {
      'message': 'You are not logged in',
      'user':   false
    });

    return;
  }

  // if user is member, carry on
  if (req.session.user.isMember) return next();
  // if they aren't redirect them to the home page
  res.render('errors', {
      'message': 'Sorry, you are not a Rosedu member :(',
      'user':   req.user ? req.user.google : false
    })
}

require('string-format')

// Base routes
var events = require('./routes/events.js')

app.get('/', events.index)
app.get('/edit', isMember, events.edit)
app.get('/delete', isMember, events.delete)
app.post('/add', isMember, events.add)


// 404 page
app.use(function(req, res, next) {
  res.status(404).render('errors', {
    'message': '404 page not found',
    'user':   req.user ? req.user.google : false
  });
});
app.use(app.router);

// Launch server
app.listen(process.env.PORT || 3000, function() {
  console.log('Server listening on port 3000.');
});
