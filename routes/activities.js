var Activity = require('../config/models/activity').activity
var Edition  = require('../config/models/activity').edition
var mongoose = require('mongoose')
var objId    = mongoose.Types.ObjectId


// Activities page
exports.index = function(req, res) {
  Activity.find().exec(gotActivities)

  function gotActivities(err, all) {
    res.render('activities', {
      'activities': all,
      'user'      : req.session.user
    })
  }
}

// Single activity page
exports.one = function(req, res) {
  var activityId = objId.fromString(req.params.activity)
  Activity.findOne({'_id': activityId}).exec(gotActivity)

  function gotActivity(err, one) {
    res.render('activity', {
      'activity'  : one,
      'user'      : req.session.user
    })
  }
}

// Add a new activity handle
exports.add = function(req, res) {
  new Activity({
    'name'        : req.body.name,
    'description' : req.body.description
  }).save(function(err) {
    if (err) console.log('[ERR] Could not save activity.')
  })

  res.redirect('/activities')
}

// Add a new edition handle
exports.add_edition = function(req, res) {
  // Get dates and format them for js date object
  var start = req.body.start_date
  var start_date = new Date(start.substring(7,11), start.substring(3,5), start.substring(0,2))
  var end = req.body.end_date
  var end_date = new Date(end.substring(7,11), end.substring(3,5), end.substring(0,2))

  // Create edition object
  var newEdition = {
    'name'        : req.body.name,
    'start'       : start_date,
    'end'         : end_date
  }

  new Edition(newEdition).save(function (err) {
    if (err) {
      console.log('[ERR] Could not save edition.')

    } else {
      // Add edition to activity object
      var find = {'_id': objId.fromString(req.params.activity)}
      var update = {$push: {'edition': newEdition}}
      Activity.update(find, update).exec()
    }
  })

  res.redirect('/activities/' + req.params.activity)
}
