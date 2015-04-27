var Activity = require('../config/models/activity').activity
var User     = require('../config/models/user').user

exports.index = function(req, res) {
  User.find({'google.email': /@rosedu.org$/}).exec(gotPeople)

  function gotPeople(err, all) {

  	all.forEach(function(son) {
  		// Get user email handle as username
  		son.google.username = son.google.email.split('@')[0]
  	})
    res.render('people', {
    	'people': all
    })
  }
}

exports.user = function(req, res) {
  _self = {}
  User.findOne({'google.email': req.params.user + '@rosedu.org'}).exec(gotUser)

  function gotUser(err, user) {
    _self.user = user
    var edition_list = []

    user.jobs.forEach(function(job) {
      edition_list.push(job.editionId)
    })

    var query = {'edition._id': {$in: edition_list}}
    var filter = {'edition': {$elemMatch: {'_id': {$in: edition_list}}}, 'name': 1, 'link': 1}
    Activity.find(query, filter).exec(gotActivities)
  }

  function gotActivities(err, activities) {
    _self.activities = {}
    // Save activities in dict for easy access
    activities.forEach(function(act) {
      act.edition.forEach(function(ed) {
        _self.activities[ed._id] = JSON.parse(JSON.stringify(act))
        _self.activities[ed._id]['edition'] = JSON.parse(JSON.stringify(ed))
        // _self.activities[ed._id]['activityId'] = act._id
        // _self.activities[ed._id]['activityName'] = act.name
        // _self.activities[ed._id]['activityLink'] = act.link
        // _self.activities[ed._id]['edition'] = JSON.parse(JSON.stringify(ed))
      })
    })

    res.render('user', {
      'user'       : _self.user,
      'activities' : _self.activities
    })
  }
}