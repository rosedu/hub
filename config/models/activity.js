var mongoose = require('mongoose')


var activitySchema = mongoose.Schema({
    name            : String,
    description     : String,
    edition         : {type: [Edition], default: []}
})

var Edition = mongoose.Schema({
    name            : String,
    people 			: [String]
})


// create the model for users and expose it to our app
exports.activity = mongoose.model('Activity', activitySchema)
