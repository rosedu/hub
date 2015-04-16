var Edition = require('../config/models/activity').edition
var Activity = require('../config/models/activity').activity
var mongoose = require('mongoose')

exports.index = function(req, res) {
  Edition.find().exec(gotEditions)

  function gotEditions(err, editions) {

    Activity.find().exec(gotActivities)

    function gotActivities(err, activities) {

      res.render('editions', {
        'editions': editions,
        'activities': activities
      })
    }
  }
}

exports.add = function(req, res) {
  var new_edition = {
    name:      req.body.name,
    description: req.body.description
  }

  Activity.update( {'_id':  mongoose.Types.ObjectId.fromString(req.body.activity_id) }, {$push:{edition: new Edition(new_edition) } }  ).exec()

  new Edition(new_edition).save()
  res.redirect('/editions')
}