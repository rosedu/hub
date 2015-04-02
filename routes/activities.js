var Activity = require('../config/models/activity')


exports.index = function(req, res) {
  Activity.find().exec(gotActivities)

  function gotActivities(err, all) {
      res.render('activities', {
        'activities': all
      })
  }
}

exports.add = function(req, res) {
  var new_activity = {
    name:      req.body.name,
    description: req.body.description
  }

  new Activity(new_activity).save()
  res.redirect('/activities')
}