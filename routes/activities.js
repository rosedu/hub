var Activity = require('../config/models/activity').activity
var Edition  = require('../config/models/activity').edition
var mongoose = require('mongoose')
var objId    = mongoose.Types.ObjectId

exports.index = function(req, res) {
  Activity.find().exec(gotActivities)

  function gotActivities(err, all) {
      res.render('activities', {
        'activities': all,
        'user'      : req.session.user
      })
  }
}

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

exports.add = function(req, res) {
  var new_activity = {
    'name'        : req.body.name,
    'description' : req.body.description
  }

  new Activity(new_activity).save()
  res.redirect('/activities')
}

exports.add_edition = function(req, res) {
  var start = req.body.start_date
  var end = req.body.end_date
  var new_edition = {
    'name'        : req.body.name,
    'start'       : new Date(start.substring(7,11), start.substring(3,5), start.substring(0,2)),
    'end'         : new Date(end.substring(7,11), end.substring(3,5), end.substring(0,2))
  }

  var newEdition = new Edition(new_edition)
  newEdition.save(function(err) {
    if(err) {
      res.render('errors', {
        'message': 'Failed to save new edition.',
        'user':   req.user ? req.user.google : false
      });
    }
  })

  var find = {'_id': objId.fromString(req.params.activity)}
  var update = {$push: {'edition': newEdition}}
  Activity.update(find, update).exec()

  res.redirect('/activities/' + req.params.activity)
}
