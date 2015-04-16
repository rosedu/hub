var mongoose = require('mongoose')
var ObjectId = mongoose.Schema.Types.ObjectId


var userSchema = mongoose.Schema({
  jobs    : [AEdR],
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
  role        : String
})


// create the model for users and expose it to our app
exports.user = mongoose.model('User', userSchema)
