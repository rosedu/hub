var mongoose = require('mongoose')
var ObjectId = mongoose.Schema.Types.ObjectId
var Macros   = require('./macros')


var userSchema = mongoose.Schema({
  jobs    : [AEdR],
  member  : Boolean,
  google  : {
    id        : String,
    token     : String,
    email     : String,
    name      : String,
    avatar    : String,
  }
})

var AEdR = mongoose.Schema({
  activityId  : ObjectId,
  editionId   : ObjectId,
  role        : {type: String, enum: Macros.EVENTS_ROLES}
})


// create the model for users and expose it to our app
exports.user = mongoose.model('User', userSchema)
exports.role = mongoose.model('Role', AEdR)
