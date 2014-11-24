var fs       = require('fs');
var express  = require('express');
bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose')
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
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


// GOOGLE LOGIN
app.get('/auth/google',
  passport.authenticate('google', {
    scope : 'email'
  }));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect : '/',
        failureRedirect : '/'
    }));


// route for logging out
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
      return next();

  // if they aren't redirect them to the home page
  res.redirect('/');
}


var Event = require('./config/models/events')

// Base routes
app.get('/', function (req, res) {

  Event.find().exec(gotEvents)

  function gotEvents(err, events) {
    res.render('index', {
      'email': (req.user ? req.user.google.email : null),
      'events': events
    })
  }
})

app.post('/add', function (req, res) {
  new Event({
    'name':        req.body.name,
    'date':        req.body.date,
    'location':    req.body.location,
    'email':       req.body.email,
    'description': req.body.description
  }).save(function(err) {
    console.log("* Event added.")
    res.redirect('/')
  })
})


// 404 page
app.use(function(req, res, next){
  res.status(404).type('txt').send('Not found');
});
app.use(app.router);

// Launch server
app.listen(process.env.PORT || 3000, function() {
  console.log('Server listening on port 3000.');
});
