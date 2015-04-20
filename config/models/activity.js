var mongoose = require('mongoose')


var activitySchema = mongoose.Schema({
  name            : String,
  description     : String,
  edition         : {type: [editionSchema], default: []}
})

var editionSchema = mongoose.Schema({
  name         : String,
  people       : [String],
  start        : Date,
  end          : Date
})


// create the model for users and expose it to our app
exports.activity = mongoose.model('Activity', activitySchema)
exports.edition = mongoose.model('Edition', editionSchema)
