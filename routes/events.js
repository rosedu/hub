var Activity = require('../config/models/activity').activity
var Event    = require('../config/models/event').event
var Macros   = require('../config/models/macros')
var Log      = require('../config/models/logs').logs
var Utils    = require('../utils')
var Markdown = require('markdown').markdown
var mongoose = require('mongoose')
var objId    = mongoose.Types.ObjectId


exports.index = function (req, res) {
  // Paginate events
  // Ensure that only positive numbers are used as page numbers.
  if (req.params.page <= 0) return res.redirect('/events/1')

  var plimit = Macros.EVENTS_PER_PAGE
  var skip   = (req.params.page - 1) * plimit
  var query  = (req.query.id ? {'_id': req.query.id} : {})

  Event.find(query).sort({'start': -1}).skip(skip).limit(plimit).exec(gotEvents)

  function gotEvents(err, events) {
    // Iterate in reverse order so we can remove items from list
    for (i = events.length-1; i >= 0; i--) {
      if (events[i].start) {
        events[i].startMonth = Macros.months[events[i].start.getMonth()]
        events[i].startDateFormatted = Utils.getFormattedDateTime(events[i].start)
      }

      if (events[i].end) {
        events[i].endMonth = Macros.months[events[i].end.getMonth()]
        events[i].endDateFormatted = Utils.getFormattedDateTime(events[i].end)
      }

      events[i].description = Markdown.toHTML(events[i].description)

      // Mark upcoming events
      if ((Date.now() - events[i].start) < 0)
        events[i].upcoming = true

      // Hide private events from nonmembers or non loggedin
      if ((!req.user || !req.session.isMember) && events[i].membersOnly)
        events.splice(i, 1)
    }

    res.render('events', {
      'user'   : req.user,
      'events' : events,
      'page'   : req.params.page,
      'id'     : req.query.id
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
    'tags':        req.body.tags.split(' '),
    'editionId':   ((req.body.edition != 'None') ? objId.fromString(req.body.edition) : null)
  }

  // Send announcement to community
  if (req.body.send_mail) Utils.mail_community(new_event)

  if (req.query.id) {
    Event.update({'_id': req.query.id}, new_event).exec()
    console.log('* Event ' + new_event.name + ' updated by ' + req.user.google.email)
  } else {
    new Event(new_event).save()
    console.log('* Event ' + new_event.name + ' added by ' + req.user.google.email)
  }

  new Log({
    'msg'  : req.user.google.email + ' added a new event.',
    'date' : Date.now()
  }).save()

  return res.redirect('/events')
}

exports.edit = function (req, res) {
  _self = {}
  Activity.find().exec(gotActivities)

  function gotActivities(err, activities) {
    _self.editions = {}

    activities.forEach(function(act) {
      act.edition.forEach(function(ed) {
        _self.editions[ed._id] = act.name + ':' + ed.name
      })
    })
    Event.findOne({'_id': req.query.id}).exec(gotEvent)
  }

  function gotEvent(err, theEvent) {
    // If we are in edit mode, hence the event exists
    if (theEvent) {
      // Format event date.
      if (theEvent.start)
        theEvent.startDateFormatted = Utils.getFormattedDateTimeForEdit(theEvent.start)
      if (theEvent.end)
        theEvent.endDateFormatted = Utils.getFormattedDateTimeForEdit(theEvent.end)
      // Format tags list
      theEvent.tags_formatted = theEvent.tags.toString().replace(/,/g, ' ')
    };

    res.render('edit', {
      'event'    : theEvent,
      'user'     : req.user,
      'editions' : _self.editions
    })
  }
}

exports.delete = function (req, res) {
  Event.remove({'_id': req.query.id}).exec(function(err, count) {
    res.redirect('/events');
  })
}
