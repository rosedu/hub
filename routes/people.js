var Activity = require('../config/models/activity').activity
var User     = require('../config/models/user').user

exports.index = function(req, res) {
  User.find({$or: [{'google.email': /@rosedu.org$/}, {'member': true}]}).exec(gotPeople)

  function gotPeople(err, all) {

  	all.forEach(function(son) {
  		// Get user email handle as username
  		son.google.username = son.google.email.split('@')[0]
  	})
    res.render('people', {
      'people': all,
      'user'  : req.user
    })
  }
}

exports.user = function(req, res) {
  _self = {}
  User.findOne({'google.email': decodeURIComponent(req.params.user)}).exec(gotUser)

  function gotUser(err, user) {
    if (!user) return res.redirect('/people')

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
      })
    })

    res.render('user', {
      'cuser'      : _self.user,
      'activities' : _self.activities,
      'user'       : req.user
    })
  }
}

exports.add = function(req, res) {
  User.update({'_id': req.query.id}, {$set: {'member': true}}).exec(function (err) {
    if (!err) console.log(req.user.google.email + ' recognized ' + req.query.link + ' as member.')
  })
  res.redirect('/people/' + req.query.link)
}
