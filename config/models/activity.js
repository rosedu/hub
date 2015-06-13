var mongoose = require('mongoose')


var activitySchema = mongoose.Schema({
  name            : String,
  link            : String,
  description     : String,
  edition         : {type: [editionSchema], default: []}
})

var editionSchema = mongoose.Schema({
  name         : String,
  link         : String,
  people       : [String], // Saved as NAME:ROLE
  start        : Date,
  end          : Date,
  enrolments   : Number,
  participants : Number,
  prizes       : Number,
  budget       : Number,
  projects     : Number,
  contributions: Number
})


// create the model for users and expose it to our app
exports.activity = mongoose.model('Activity', activitySchema)
exports.edition = mongoose.model('Edition', editionSchema)
