var mongoose = require("mongoose");

var eventSchema = mongoose.Schema({
	name        :String,
	image       :String,
	description :String,
	date        :Date,
	venue    	:String,
	type        :String,
	time        :String,
	count	    :Number,
	invitees:[
		{
			id:
			{
				type:mongoose.Schema.Types.ObjectId,
				ref:"User"
			},
			name:String
		}
	],
	owner:{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
	},
	pendingRequests:[
		{
			id:	{
				type:mongoose.Schema.Types.ObjectId,
				ref:"User"
			},
			name:String
		}
	],
	invitationCard : {
				text      	: String,
				color 	    : {type:String ,default:"black"},
				background  : {type:String ,default:"black"},
				font_size	: {type:String ,default:"16px"},
				font_family : {type:String ,default:"Arial"}
	}
})

module.exports = mongoose.model("Event",eventSchema);