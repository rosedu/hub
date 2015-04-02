var mongoose = require('mongoose')


var activitySchema = mongoose.Schema({
    name            : String,
    description     : String,
    edition         : {type: [Edition], default: []}
})

var Edition = mongoose.Schema({
    name            : String
})


// create the model for users and expose it to our app
module.exports = mongoose.model('Activity', activitySchema)
