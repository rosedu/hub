var Event = require('../config/models/event')
var Macros = require('../config/models/macros')
var Utils = require('../utils')
var Markdown = require('markdown').markdown
var util = require('util')


exports.index = function (req, res) {
  // Paginate events
  // Ensure that only numbers are used as page numbers.
  if (req.params.page <= 0 || isNaN(parseFloat(req.params.page))) return res.redirect('/events/1')

  plimit = Macros.EVENTS_PER_PAGE
  skip = (req.params.page - 1) * plimit

  Event.find().sort({'start': -1}).skip(skip).limit(plimit).exec(gotEvents)

  function gotEvents(err, events) {
    // Iterate in reverse order so we can remove items from list
    for (i = events.length-1; i >= 0; i--) {
      events[i].startMonth = Macros.months[events[i].start.getMonth()]
      events[i].startDateFormatted = getFormattedDate(events[i].start)

      if (events[i].end) {
        events[i].endMonth = Macros.months[events[i].end.getMonth()]
        events[i].endDateFormatted = getFormattedDate(events[i].end)
      }

      events[i].description = Markdown.toHTML(events[i].description)

      // Mark upcoming events
      if ((Date.now() - events[i].start) < 0)
        events[i].upcoming = true

      // Hide private events from nonmembers or non loggedin
      if ((!req.session.user || !req.session.user.isMember) && events[i].membersOnly)
        events.splice(i, 1)
    }

    res.render('events', {
      'user':   req.session.user,
      'events': events,
      'page':   req.params.page
    })
  }
}

exports.add = function (req, res) {
  eventStartDate = new Date(req.body.start_date)
  eventEndDate = new Date(req.body.end_date)

  new_event = {
    'name':        req.body.name,
    'start':       eventStartDate,
    'end':         eventEndDate,
    'location':    req.body.location,
    'email':       req.body.email,
    'link':        req.body.link,
    'description': req.body.description,
    'membersOnly': ((req.body.membersonly == 'on') ? true : false),
    'tags':        req.body.tags.split(' ')
  }

  // Send announcement to community
  if (req.body.send_mail) Utils.mail_community(new_event)

  if (req.query.id) {
    Event.update({'_id': req.query.id}, new_event).exec()
    console.log('* Event ' + new_event.name + ' updated by ' + req.session.user.email)
  } else {
    new Event(new_event).save()
    console.log('* Event ' + new_event.name + ' added by ' + req.session.user.email)
  }

  res.redirect('/events')
}

exports.edit = function (req, res) {
  Event.findOne({'_id': req.query.id}).exec(gotEvent)

  function gotEvent(err, theEvent) {
    // If we are in edit mode, hence the event exists
    if (theEvent) {
      // Format event date.
      theEvent.startDateFormatted = getFormattedDateForEdit(theEvent.start)
      theEvent.endDateFormatted = getFormattedDateForEdit(theEvent.end)
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
  Event.remove({'_id': req.query.id}).exec(function(err, count) {
    res.redirect('/events');
  })
}


// Utils
function getFormattedDate(date) {
  return util.format('%d %s %d %s:%s',
    date.getDate(),
    Macros.months[date.getMonth()],
    date.getFullYear(),
    ('0' + date.getHours()).slice(-2),
    ('0' + date.getMinutes()).slice(-2))
}

function getFormattedDateForEdit(date) {
  return util.format('%d/%d/%d %s:%s',
    ('0' + (date.getMonth() + 1)).slice(-2),
    date.getDate(),
    date.getFullYear(),
    date.getHours(),
    date.getMinutes())
}