var Event = require('../config/models/events')
var Macros = require('../config/models/macros')
var Markdown = require('markdown').markdown


exports.index = function (req, res) {
  Event.find().sort({'date': -1}).exec(gotEvents)

  function gotEvents(err, events) {
    // Iterate in reverse order so we can remove items from list
    for (i = events.length-1; i >= 0; i--) {
      events[i].month = Macros.months[events[i].date.getMonth()];
      events[i].formattedDate = getFormattedDate(events[i].date)
      events[i].description = Markdown.toHTML(events[i].description);

      // Mark upcoming events
      if ((Date.now() - events[i].date) < 0)
        events[i].upcoming = true

      // Hide private events from nonmembers or non loggedin
      if ((!req.session.user || !req.session.user.isMember) && events[i].membersOnly)
        events.splice(i, 1)
    }

    res.render('index', {
      'user':   req.session.user,
      'events': events
    })
  }
}

exports.add = function (req, res) {
  var eventDate = new Date();
  eventDate = req.body.date;

  new_event = {
    'name':        req.body.name,
    'date':        eventDate,
    'location':    req.body.location,
    'email':       req.body.email,
    'link':        req.body.link,
    'description': req.body.description,
    'membersOnly': ((req.body.membersonly == 'on') ? true : false),
    'tags':        req.body.tags.split(" ")
  }

  if (req.query.id)
    Event.update({'_id': req.query.id}, new_event).exec()
  else
    new Event(new_event).save()

  res.redirect('/')
}

exports.edit = function (req, res) {
  Event.findOne({'_id': req.query.id}).exec(gotEvent)

  function gotEvent(err, theEvent) {
    // If we are in edit mode, hence the event exists
    if (theEvent) {
      // Format event date.
      theEvent.dateFormatted = getFormattedDateForEdit(theEvent.date)
      // Format tags list
      theEvent.tags_formatted = theEvent.tags.toString().replace(/,/g, ' ')
    };

    res.render('edit', {
      'event': theEvent,
      'user':  req.session.user
    })
  }
}

exports.delete = function (req, res) {
  Event.remove({'_id': req.query.id}).exec(function(err, count){
    res.redirect('/');
  })
}


// Utils
function getFormattedDate(date) {
  minutes = date.getMinutes();
  if (date.getMinutes() == 0) {
    minutes = "00";
  };
  formatted = "{0} {1} {2} {3}:{4}".format(
    date.getDate(),
    Macros.months[date.getMonth()],
    date.getFullYear(),
    date.getHours(),
    minutes);
  return formatted;
}

function getFormattedDateForEdit(date) {
  minutes = date.getMinutes();
  if (date.getMinutes() == 0) {
    minutes = "00";
  };
  formatted = "{0}/{1}/{2} {3}:{4}".format(
    ("0" + (date.getMonth() + 1)).slice(-2),
    date.getDate(),
    date.getFullYear(),
    date.getHours(),
    minutes);
  return formatted;
}