var express      = require('express')
var bodyParser   = require('body-parser')
var app = module.exports = express()


// Connect to database
var mongoose = require('mongoose')
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

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


// if NODE_ENV environment variable is set to 'development' then anyone can
// access the full features of the site, so doesn't need to be a ROSEdu member
var email_suffix = (process.env.NODE_ENV === 'development') ? '@gmail.com' : '@rosedu.org'

app.post('/auth/google/callback', passport.authenticate('google'), function(req, res) {
    // Init session vars
    profile = req.user.google
    isMember = (profile.email.indexOf(email_suffix) > -1) ? true:false

    // If user is recognized as member
    if (req.user.member) isMember = true

    req.session.user = {}
    req.session.user.id = profile.id
    req.session.user.name = profile.name
    req.session.user.email = profile.email
    req.session.user.token = profile.token
    req.session.user.isMember = isMember

    // Redirect to index page from ajax
    res.send('/')
});

app.get('/logout', function(req, res) {

    // Revoke token
    if (req.session.user) {
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
          })
      })
    } else {
      res.redirect('/')
    }
})

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


// Base routes
var events = require('./routes/events.js')

// Temporary redirect
app.get('/', function(req, res) { res.redirect('/events') })

app.get('/events', events.index)
app.get('/events/edit', isMember, events.edit)
app.get('/events/delete', isMember, events.delete)
app.post('/events/add', isMember, events.add)
app.get('/events/:page', events.index)

var people = require('./routes/people.js')
app.get('/people', people.index)
app.get('/people/add', isMember, people.add)
app.get('/people/:user', people.user)

var activities = require('./routes/activities.js')
app.get('/activities', activities.index)
app.get('/activities/edit', isMember, activities.edit)
app.post('/activities/add', isMember, activities.add)
app.get('/activities/:activity', activities.activity)
app.post('/activities/:activity/add_edition', isMember, activities.add_edition)
app.get('/activities/:activity/:edition', activities.edition)
app.post('/activities/:activity/:edition/add_role', isMember, activities.add_role)
app.get('/activities/:activity/:edition/remove_role', isMember, activities.remove_role)


// 404 page
app.use(function(req, res, next) {
  res.status(404).render('errors', {
    'message': '404 page not found',
    'user':   req.user ? req.user.google : false
  });
});
app.use(app.router);

// Launch server
app.listen(process.env.PORT || 4000, function() {
  console.log('Server listening on port 4000.');
});
