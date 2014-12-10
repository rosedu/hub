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
app.use('/public', express.static(__dirname + '/public'));
app.use('/bower', express.static(__dirname + '/bower_components'));

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
  if (req.user.google.email.indexOf('@rosedu.org') > -1) return next();
  // if they aren't redirect them to the home page
  res.render('errors', {
      'message': 'Sorry, you are not a Rosedu member :(',
      'user':   req.user ? req.user.google : false
    })
}


var Event = require('./config/models/events')
var Macros = require('./config/models/macros')

// Base routes
app.get('/', function (req, res) {
  Event.find().exec(gotEvents)

  // Mark our members
  if (req.user && req.user.google.email.indexOf('@rosedu.org') > -1)
    req.user.google['isMember'] = true

  function gotEvents(err, events) {

    for (i = 0; i < events.length; i++) {
      events[i].month = Macros.months[events[i].date.substring(0, 2)];
    }

    res.render('index', {
      'user':   req.user ? req.user.google : false,
      'events': events
    })
  }
})

app.post('/add', isMember, function (req, res) {
  new_event = {
    'name':        req.body.name,
    'date':        req.body.date,
    'location':    req.body.location,
    'email':       req.body.email,    
    'link':        req.body.link,
    'description': req.body.description
  }

  if (req.query.id)
    Event.update({'_id': req.query.id}, new_event).exec()
  else
    new Event(new_event).save()

  res.redirect('/')
})

app.get('/edit', isMember, function (req, res) {

  id = (req.query.id ? req.query.id : null)
  Event.findOne({'_id': id}).exec(gotEvent)

  function gotEvent(err, theEvent) {

    res.render('edit', {
      'event': theEvent,
      'user':  req.user.google
    })
  }
})

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
