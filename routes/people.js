var User = require('../config/models/user')

exports.index = function(req, res) {
  User.find().exec(gotPeople)

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
  User.find({'google.email': req.params.user + '@rosedu.org'}).exec(gotUser)

  function gotUser(err, user) {
    res.render('user', {
    	'user': user
    })
  }
}