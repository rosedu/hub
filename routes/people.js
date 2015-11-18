var Activity = require('../config/models/activity').activity
var User     = require('../config/models/user').user
var Role     = require('../config/models/user').role
var Log      = require('../config/models/logs').logs


exports.profile = function(req, res) {
  var redirect_path = '/people/' + encodeURIComponent(req.user.google.email)
  if (!req.user.name)
    redirect_path += '/edit'

  res.redirect(redirect_path)
}


exports.index = function(req, res) {
  _self = {}
  User.find({$or: [{'google.email': /@rosedu.org$/}, {'member': true}]}).exec(gotPeople)

  function gotPeople(err, all) {

  	all.forEach(function(son) {
  		// Get user email handle as username
  		son.google.username = son.google.email.split('@')[0]
  	})

    _self.people = all
    Log.find({'public': true}).exec(gotLogs)
  }

  function gotLogs(err, logs) {
    res.render('people', {
      'people': _self.people,
      'user'  : req.user,
      'logs'  : logs
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

    var match  = {"$match" : {'edition._id': {$in: edition_list}}}
    var unwind = {"$unwind" : "$edition"}
    Activity.aggregate([match, unwind, match], gotActivities)
  }

  function gotActivities(err, activities) {
    _self.activities = {}
    // Save activities in dict for easy access
    activities.forEach(function(act) {
      var year = act.edition.start.getFullYear()
      if (!(year in _self.activities))
        _self.activities[year] = []

      _self.activities[year].push(act)
    })

    res.render('user', {
      'cuser'      : _self.user,
      'activities' : _self.activities,
      'user'       : req.user,
      'action'     : req.params.action
    })
  }
}

exports.edit = function(req, res) {
  if (req.body.id == req.user._id) {

    var query  = {'_id': req.user._id}
    var roles  = []
    var update = {
      $push: {'jobs': roles},
      $set:  {'name': req.body.name}
    }

    // Find the roles which the current user had
    Activity.find().exec(function(err, all) {
      all.forEach(function(act) {
        act.edition.forEach(function(ed) {
          ed.people.forEach(function(peep) {
            var name = peep.split(':')[0]
            var role = peep.split(':')[1]

            if (name == req.body.name) {
              // Save found role
              roles.push(new Role({
                'activityId' : act._id,
                'editionId'  : ed._id,
                'role'       : role
              }))
            }
          })
        })
      })
    })

    // Update user profile
    User.update(query, update).exec(function(err, update) {
      new Log({
        'msg'  : req.user.google.email + ' changed his name.',
        'date' : Date.now()
      }).save()
      return res.redirect('/profile')
    })

  } else {
    return res.redirect('/people')
  }
}

exports.add = function(req, res) {
  User.update({'_id': req.query.id}, {$set: {'member': true}}).exec(function (err) {
    if (!err) console.log(req.user.google.email + ' recognized ' + req.query.link + ' as member.')
  })
  res.redirect('/people/' + req.query.link)
}
