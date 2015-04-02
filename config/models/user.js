var mongoose = require('mongoose')


var userSchema = mongoose.Schema({
	jobs 		: [AEdR],
    google 		: {
        id           : String,
        token        : String,
        email        : String,
        name         : String,
        avatar 		 : String,
    }
})

var AEdR = mongoose.Schema({
	activity_id 	: String,
	edition_id 		: String,
	role 			: String
})


// create the model for users and expose it to our app
exports.user = mongoose.model('User', userSchema)
