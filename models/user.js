var mongoose = require("mongoose"),
	passportLocalMongoose = require("passport-local-mongoose");

var userSchema = mongoose.Schema({
	username:String,
	password:String,
	invited:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"Event"
		},
	],
	owner:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"Event"
		}
	],
	receivedInvites:[
		{
			id:{
				type:mongoose.Schema.Types.ObjectId,
				ref:"Event",
			},
			eventOwner:String,
			eventName:String
		}
	],
	notifications:[String],
	newNotifications:Number
	// firstName:String,
	// lastName:String,
	// email:String,
	// phone:String
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);