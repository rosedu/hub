var mongoose = require('mongoose')
var ObjectId = mongoose.Schema.Types.ObjectId


var eventSchema = mongoose.Schema({
    name         : String,
    start        : Date,
    end          : Date,
    location     : String,
    email        : String,
    link         : String,
    description  : String,
    publisher    : String,
    membersOnly  : {type: Boolean, default: false},
    tags         : [String],
    editionId    : ObjectId,
})


// create the model for users and expose it to our app
exports.event = mongoose.model('Event', eventSchema)
