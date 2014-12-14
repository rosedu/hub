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


app.post('/auth/google/callback', passport.authenticate('google'), function(req, res) {
    // Init session vars
    profile = req.user.google
    isMember = (profile.email.indexOf('@rosedu.org') > -1) ? true:false

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


var Event = require('./config/models/events')
var Macros = require('./config/models/macros')
var Markdown = require('markdown').markdown

// Base routes
app.get('/', function (req, res) {
  Event.find().exec(gotEvents)

  function gotEvents(err, events) {
    // Iterate in reverse order so we can remove items from list
    for (i = events.length-1; i >= 0; i--) {
      events[i].month = Macros.months[events[i].date.substring(0, 2)];
      events[i].description = Markdown.toHTML(events[i].description);

      // Hide private events from nonmembers or non loggedin
      if ((!req.session.user || !req.session.user.isMember) && events[i].membersOnly)
        events.splice(i, 1)
    }

    res.render('index', {
      'user':   req.session.user,
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
    'description': req.body.description,
    'membersOnly': ((req.body.membersonly == 'on') ? true : false)
  }

  if (req.query.id)
    Event.update({'_id': req.query.id}, new_event).exec()
  else
    new Event(new_event).save()

  res.redirect('/')
})

app.get('/edit', isMember, function (req, res) {

  Event.findOne({'_id': req.query.id}).exec(gotEvent)

  function gotEvent(err, theEvent) {

    res.render('edit', {
      'event': theEvent,
      'user':  req.session.user
    })
  }
})

app.get('/delete', isMember, function (req, res) {
  Event.remove({'_id': req.query.id}).exec(function(err, count){
    res.redirect('/');
  })
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
