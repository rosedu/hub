var mongoose = require('mongoose')
var ObjectId = mongoose.Schema.Types.ObjectId


var logSchema = mongoose.Schema({
    msg    : String,
    date   : Date,
    public : {type: Boolean, default: false},
})


// create the model for users and expose it to our app
exports.logs = mongoose.model('Log', logSchema)
