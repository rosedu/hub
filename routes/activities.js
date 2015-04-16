var Activity = require('../config/models/activity').activity
var Edition  = require('../config/models/activity').edition
var mongoose = require('mongoose')


exports.index = function(req, res) {
  Activity.find().exec(gotActivities)

  function gotActivities(err, all) {
      res.render('activities', {
        'activities': all
      })
  }
}

exports.one = function(req, res) {
  activityId = mongoose.Types.ObjectId.fromString(req.params.activity)
  Activity.findOne({'_id': activityId}).exec(gotActivity)

  function gotActivity(err, one) {
      res.render('activity', {
        'activity': one
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
  start = req.body.start_date
  end = req.body.end_date
  var new_edition = {
    'name'        : req.body.name,
    'start'       : new Date(start.substring(7,11), start.substring(3,5), start.substring(0,2)),
    'end'         : new Date(end.substring(7,11), end.substring(3,5), end.substring(0,2))
  }

  find = {'_id': mongoose.Types.ObjectId.fromString(req.params.activity)}
  update = {$push: {'edition': new Edition(new_edition)}}
  Activity.update(find, update).exec()

  new Edition(new_edition).save()
  res.redirect('/activities/' + req.params.activity)
}
