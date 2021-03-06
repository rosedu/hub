var Activity = require('../config/models/activity').activity
var Edition  = require('../config/models/activity').edition
var Event    = require('../config/models/event').event
var Role     = require('../config/models/user').role
var User     = require('../config/models/user').user
var Macros   = require('../config/models/macros')
var Utils    = require('../utils')
var mongoose = require('mongoose')
var objId    = mongoose.Types.ObjectId

var roles = ['Organiser', 'Teacher', 'Mentor', 'Participant']


// Activities page
exports.index = function(req, res) {
  Activity.find().exec(gotActivities)

  function gotActivities(err, all) {
    res.render('activities', {
      'activities': all,
      'user'      : req.user
    })
  }
}

// Single activity page
exports.activity = function(req, res) {
  Activity.findOne({'link': req.params.activity}).exec(gotActivity)

  function gotActivity(err, one) {
    if (!one) return res.redirect('/activities')

    edition = null
    // Check if in edition edit mode
    if (req.query.link) {
      // Get current edition
      one.edition.forEach(function(ed) {
        if (ed.link == req.query.link)
          edition = ed
      })

      if (edition) {
        // Format dates from Date Object to Datepicket string
        edition.start_format = Utils.getFormattedDateForEdit(edition.start)
        edition.end_format   = Utils.getFormattedDateForEdit(edition.end)
      }

    } else {
      // Provide unique participants list
      one.edition.forEach(function(ed) {
        var uniq_people = []
        ed.people.forEach(function(peep) {
          var name = peep.split(':')[0]
          if (uniq_people.indexOf(name) < 0)
            uniq_people.push(name)
        })
        ed.people = uniq_people
      })
    }

    res.render('activity', {
      'activity'  : one,
      'edition'   : edition,
      'user'      : req.user
    })
  }
}

// Edit an activity
exports.edit = function(req, res) {
  Activity.findOne({'link': req.query.link}).exec(gotActivity)

  function gotActivity(err, theActivity) {
    if(!theActivity)
      return res.redirect('/activities')
    res.render('activities', {
      'activity' : theActivity,
      'user'     : req.user
    })
  }
}

// Add a new activity handle
exports.add = function(req, res) {

  //Create new activity and add it if is new or update it if we got the id
  new_activity = {
    'name'        : req.body.name,
    'logo'        : req.body.logo,
    'link'        : encodeURIComponent(req.body.name.replace(/\s+/g, '')),
    'description' : req.body.description
  }

  if (req.query.id) {
    Activity.update({'_id': req.query.id}, new_activity).exec()
  }
  else {
    new Activity(new_activity).save(function(err) {
      if (err) console.log('[ERR] Could not save activity.')
    })
  }

  res.redirect('/activities')
}

// Add or edit an edition
exports.add_edition = function(req, res) {
  // Format dates from Datepicker string to Date Obj
  var ed_start_date = Utils.setFormattedDateForEdit(req.body.start_date)
  var ed_end_date   = Utils.setFormattedDateForEdit(req.body.end_date)

  // Generate link of edition from name, minus the whitespaces, all URI encoded
  var ed_link = encodeURIComponent(req.body.name.replace(/\s+/g, ''))

  // Create edition object
  var newEdition = new Edition({
    'name'         : req.body.name,
    'link'         : ed_link,
    'logo'         : req.body.logo,
    'site'         : req.body.site,
    'description'  : req.body.description,
    'start'        : ed_start_date,
    'end'          : ed_end_date,

    'enrolments'   : req.body.enrolments,
    'participants' : req.body.participants,
    'prizes'       : req.body.prizes,
    'projects'     : req.body.projects,
    'contributions': req.body.contributions
  })

  // Commit to DB
  if (req.query.link) {
    // Update existing edition
    Activity.update({
      'link': req.params.activity,
      'edition.link': req.query.link
    }, {'$set': {
      'edition.$.name'         : req.body.name,
      'edition.$.link'         : ed_link,
      'edition.$.logo'         : req.body.logo,
      'edition.$.site'         : req.body.site,
      'edition.$.description'  : req.body.description,
      'edition.$.start'        : ed_start_date,
      'edition.$.end'          : ed_end_date,

      'edition.$.enrolments'   : req.body.enrolments,
      'edition.$.participants' : req.body.participants,
      'edition.$.prizes'       : req.body.prizes,
      'edition.$.projects'     : req.body.projects,
      'edition.$.contributions': req.body.contributions
    }}).exec(function (err) {
      if (err) console.log(err)
    })

  } else {
    // Push new edition to activity
    var query  = {'link': req.params.activity}
    var update = {$push: {'edition': newEdition}}
    Activity.update(query, update).exec(function (err) {
      if (err) console.log(err)
    })
  }

  res.redirect('/activities/' + req.params.activity)
}

// Add a new person to an edition
exports.add_role = function(req, res) {
  Activity.findOne({'link': req.params.activity}).exec(gotActivity)

  function gotActivity(err, one) {
    var role = new Role({
      'activityId' : one._id,
      'editionId'  : objId(req.body.edition),
      'role'       : req.body.role
    })

    req.body.name = req.body.name.split('\r\n')
    if (typeof req.body.name == "string")
      req.body.name = [req.body.name]

    // For each name provided
    req.body.name.forEach(function(name) {
      // Add role to user jobs
      var query  = {'google.name': name}
      var update = {$push: {'jobs': role}}
      User.update(query, update).exec()

      // Add user to edition
      var user   = name + ':' + req.body.role
      var query  = {'edition._id': objId(req.body.edition)}
      var update = {$addToSet: {'edition.$.people': user}}
      Activity.update(query, update).exec(function (err, count) {
        if (req.user)
          console.log('* ' + req.user.google.email + ' added ' + name + ' as ' +
            req.body.role + ' for edition: ' + req.body.edition)
      })
    })

    res.redirect('/activities/' + req.params.activity + '/' + req.params.edition)
  }
}


// Remove role from edition
exports.remove_role = function(req, res) {
  _self = {}
  Activity.findOne({'link': req.params.activity}).exec(gotActivity)

  function gotActivity(err, one) {
    _self.activity = one
    // Get deleted user
    var name = req.query.data.split(':')[0]
    var query  = {'google.name': name}
    User.findOne(query).exec(gotUser)
  }

  function gotUser(err, user) {
    // If user is found, identify deleted role and remove from user
    if (user) {
      var name = req.query.data.split(':')[0]
      var role = req.query.data.split(':')[1]
      user.jobs.forEach(function(job) {
        if (job.role == role && job.activityId.toString() == _self.activity._id.toString()) {
          // Delete current role
          var query  = {'google.name': name}
          var update = {$pull: {'jobs': job}}
          User.update(query, update).exec()
        }
      })
    }

    // Remove user from edition
    var query  = {'edition.link': req.params.edition}
    var update = {$pull: {'edition.$.people': req.query.data}}
    Activity.update(query, update).exec(function (err, count) {
      if (req.user)
        console.log('* ' + req.user.google.email + ' removed ' + req.query.data +
          ' for edition: ' + req.params.edition)
    })

    res.redirect('/activities/' + req.params.activity + '/' + req.params.edition)
  }
}


// List info about one edition
exports.edition = function(req, res) {
  _self = {}
  Activity.findOne({'link': req.params.activity}).exec(gotActivity)

  function gotActivity(err, one) {
    _self.activity = one
    // Remove extra data
    _self.activity.editions = []

    one.edition.forEach(function(ed) {
      if (ed.link === req.params.edition)
        _self.edition = ed
    })

    if (_self.edition) {
      gotEdition(_self.edition)
    } else {
      return res.redirect('/activities/' + req.params.activity)
    }
  }

  function gotEdition(ed) {
    _self.users = {}

    var user_list = []

    // Define user categories
    roles.forEach(function(role) {
      _self.users[role] = {}
    })

    // Reformat people list to be easily processed
    ed.people.forEach(function(peep) {
      name = peep.split(':')[0]
      role = peep.split(':')[1]

      user_list.push(name)
      _self.users[role][name] = {}
    })

    var query = {'google.name': {$in: user_list}, 'google.email': /@rosedu.org$/}
    User.find(query).exec(gotUsers)
  }

  function gotUsers(err, users) {
    users.forEach(function(user) {
      roles.forEach(function(role) {
        if (user.google.name in _self.users[role])
          _self.users[role][user.google.name] = user
      })

    })

    var query = {'editionId': _self.edition._id}
    Event.find(query).exec(gotEvents)
  }

  function gotEvents(err, events) {
    _self.events = events

    res.render('edition', {
      'activity' : _self.activity,
      'myedition': _self.edition,
      'events'   : _self.events,
      'users'    : _self.users,
      'user'     : req.user,
      'roles'    : Macros.EVENTS_ROLES
    })
  }
}
