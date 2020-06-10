var express   = require("express"),
	router	  = express.Router(),
	Event	  = require("../models/event.js"),
	User	  = require("../models/user.js");	


//View All events
router.get("/events",function(req,res){
	Event.find({},function(err,foundEvent){
		res.render("allevents",{ events : foundEvent });
	})
})

//Create a new event
router.get("/events/new",isLoggedIn,function(req,res){
	res.render("new");
})

router.post("/events",isLoggedIn,function(req,res){
	req.body.events.description = req.sanitize(req.body.events.description);
	req.body.events.venue = req.sanitize(req.body.events.venue);
	req.body.events.invitationCard.text = req.sanitize(req.body.events.invitationCard.text);
	Event.create(req.body.events,function(err,newEvent){
		if(err){
			console.log(err);
		}
		else{
			newEvent.owner = req.user._id;
			newEvent.count = 0;
			newEvent.save();
			req.user.owner.push(newEvent._id);
			req.user.save();
			req.flash("success","Created a newEvent!");
			res.redirect("events/"+newEvent._id+"/events_invite_form");	
		}
	})
})

//Show an event
router.get("/events/:id",function(req,res){
	Event.findById(req.params.id).populate("owner").exec(function(err,foundEvent){
		if(err&&!foundEvent){
			req.flash("error","Cannot find event");
			res.redirect("/events");
		}
		else{
			res.render("show",{event:foundEvent});
		}
	})
})

//Edit an event
router.get("/events/:id/edit",isOwner,function(req,res){
	Event.findById(req.params.id,function(err,foundEvent){
		if(err&&!foundEvent){
			console.log(err);
			req.flash("error","Cannot find event!");
			res.redirect("/events");
		}
		else{
			res.render("editevent",{event:foundEvent});	
		}
	})
})

//Update an event
router.put("/events/:id",isOwner,function(req,res){	
	
	req.body.events.description = req.sanitize(req.body.events.description);
	req.body.events.venue = req.sanitize(req.body.events.venue);
	
	Event.findByIdAndUpdate(req.params.id,req.body.events,function(err,edittedEvent){
		if(err&&!edittedEvent){
			console.log(err);
			req.flash("error","Cannot find event!");
			res.redirect("/events");
		}
		else{
			User.find({},function(err,users){
				if(err){
					console.log(err);
				}
				else{
					users.forEach(function(elem){
						elem.notifications.push(edittedEvent.name + " has been updated!");
						elem.newNotifications+=1;
						elem.save();
					})
				}
			})
			res.redirect("/events/"+req.params.id);
		}
	})
	
})

//Delete an event
router.delete("/events/:id",isOwner,function(req,res){
	var event;
	Event.findById(req.params.id,function(err,foundEvent){
		if(err&&!foundEvent){
			console.log(err);
			req.flash("error","Cannot find event!");
			res.redirect("/events");	
		}else{
			event = foundEvent.name;
		}
	})
	Event.findByIdAndRemove(req.params.id,function(err){
		if(err){
			console.log(err);
		}else{
			User.find({},function(err,users){
				if(err){
					console.log(err);
				}else{
					users.forEach(function(elem){
						elem.notifications.push(event+" is no longer a part of D-event");
						elem.newNotifications+=1;
						elem.save();
					})
				}
			res.redirect("/events");
			})

		}
	})
})

//Created event's invitation form
router.get("/events/:id/events_invite_form",isLoggedIn,function(req,res){
	User.find({},function(err,users){
		if(err){
			console.log(err);
		}
		else{
			Event.findById(req.params.id).populate("invitees owner").exec(function(err,foundEvent){
				if(err){
					console.log(err&&!foundEvent);
					req.flash("error","Cannot find event!");
					res.redirect("/events");	
				}
				else{
					res.render("invite",{users:users,event:foundEvent});	
				}
			})
		}
	})
})

//Host sending Invitation...
router.post("/events/:id/req_sent_form",isLoggedIn,function(req,res){
	User.findOne({username:req.body.username},function(err,foundUser){
		if(err&!foundUser){
			console.log(err);
			req.flash("error","Cannot find user");
			res.redirect("/")
		}
		else{
			Event.findById(req.params.id).populate("owner").exec(function(err,foundEvent){
				if(err&&!foundEvent){
					console.log(err);
					req.flash("error","Cannot find event");
					res.redirect("/events");
				}
				else{
					var sendRequest = {
						 eventOwner : foundEvent.owner.username,
						 eventName  : foundEvent.name,
						 id         : foundEvent._id
					}
					foundUser.receivedInvites.push(sendRequest);
					//Send a notification to the invitee w
					foundUser.notifications.push("You have received an invitation for " + foundEvent.name + " from " + foundEvent.owner.username );

					foundUser.newNotifications+=1;
					foundUser.save();
					req.flash("success","Invitation sent to "+foundUser.username);
					res.redirect("/events/" + req.params.id + "/events_invite_form");
				}
			})
		}
	})
})

//User accepts host
router.post("/events/:id/events_invite_form_accept/:user_id",isLoggedIn,function(req,res){
	User.findById(req.params.user_id,function(err,foundUser){
		if(err&!foundUser){
			console.log("Not found");
			req.flash("error","Cannot find User");
			res.redirect("/");
		}else{
			foundUser.invited.push(req.params.id);
			Event.findById(req.params.id).populate("owner").exec(function(err,foundEvent){
				//removefromRI
				var foundIndexRI = -1;
				foundUser.receivedInvites.forEach(function(elem,index){
					if(elem.id.equals(req.params.id)){
						foundIndexRI = index;
					}
				})
				foundUser.receivedInvites.splice(foundIndexRI,1);
				foundUser.save();
				//addToTheInvitees
				var addToTheInvitees = {
					id  : foundUser._id,
					name: foundUser.username
				}
				foundEvent.invitees.push(addToTheInvitees);
				//removeFromPR
				var foundIndex = -1;
				foundEvent.pendingRequests.forEach(function(elem,index){
					if(elem.id.equals(foundUser._id)){
						foundIndex = index;
					}
				})
				foundEvent.pendingRequests.splice(foundIndex,1);
				//Adding a notification to the host!
				console.log(foundEvent);
				if(req.body.count!=1){
				foundEvent.owner.notifications.push( foundUser.username + " will join with " + (req.body.count-1).toString() + " other(s) to " + foundEvent.name);	
				}else{
				foundEvent.owner.notifications.push( foundUser.username + " will join "+ foundEvent.name);
				}
				foundEvent.owner.newNotifications+=1;
				foundEvent.count+=req.body.count;
				foundEvent.owner.save();
				foundEvent.save();
				console.log(foundEvent);
			})
			Event.findById(req.params.id).populate('invitees').exec(function(err,foundEvent){
				res.redirect("back");
			})
		}
	})	
})

//User rejects host
router.post("/events/:id/events_invite_form_reject/:user_id",isLoggedIn,function(req,res){
	User.findById(req.params.user_id,function(err,foundUser){
		if(err&!foundUser){
			console.log(err);
			req.flash("error","Cannot find User");
			res.redirect("/");
		}
		else{
			Event.findById(req.params.id).populate("owner").exec(function(err,foundEvent){
				if(err&!foundEvent){
					console.log(err);
					req.flash("error","Cannot find event");
					res.redirect("/");
				}
				else{
					foundEvent.owner.notifications.push( foundUser.username + " has rejected your invitation for " + foundEvent.name);
					foundEvent.owner.newNotifications+=1;
					foundEvent.owner.save();
					foundEvent.save();
				}
			})
			var foundIndexRI = -1 ;
			foundUser.receivedInvites.forEach(function(elem,index){
				if(elem.id.equals(req.params.id)){
					foundIndexRI = index;
				}
			})
			if(foundIndexRI==-1){
				console.log("User not found");
			}
			else{
				foundUser.receivedInvites.splice(foundIndexRI,1);
				foundUser.save();
				res.redirect("back");
			}
		}
	})
})

//Host accepts user
router.get("/events/:id/acceptance_form/:user_id",isOwner,function(req,res){
	User.findById(req.params.user_id,function(err,foundUser){
		if(err&!foundUser){
			console.log(err);
			req.flash("error","Cannot find user");
			res.redirect("/");
		}
		else{
			foundUser.invited.push(req.params.id);
			Event.findById(req.params.id).populate("owner").exec(function(err,foundEvent){
				if(err&!foundEvent){
					console.log(err);
					req.flash("error","Cannot find event");
					res.redirect("/");
				}
				else{
					var newInvitee = {
						id:req.params.user_id,
						name:foundUser.username
					}
					foundEvent.invitees.push(newInvitee);
					foundUser.notifications.push("You have been invited to join " + foundEvent.name + " from " + foundEvent.owner.username);
					foundUser.newNotifications+=1;
					foundUser.save();
					var foundIndex=-1;
					foundEvent.pendingRequests.forEach(function(elem,index){
						if(elem.id.equals(req.params.user_id)){
	                       foundIndex = index;
						  }
					})
					if(foundIndex!=-1){
						foundEvent.pendingRequests.splice(foundIndex,1);
						foundEvent.save();	
						res.redirect("back");	
					}else{
						res.send("No user found");
					}
				}
			})
		}
	})
})

//Host rejects user
router.get("/events/:id/removal_form/:user_id",isOwner,function(req,res){
		User.findById(req.params.user_id,function(err,foundUser){
		if(err&!foundUser){
			console.log(err);
			req.flash("error","Cannot find user");
			res.redirect("/");
		}
		else{
			Event.findById(req.params.id).populate("owner").exec(function(err,foundEvent){
				if(err&!foundEvent){
					console.log(err);
					req.flash("error","Cannot find event");
					res.redirect("/events");
				}
				else{
					foundUser.notifications.push("You have been declined to join " + foundEvent.name + " by " + foundEvent.owner.username );
					foundUser.newNotifications+=1;
					foundUser.save();
					var foundIndex = -1;
					foundEvent.pendingRequests.forEach(function(elem,index){
						if(elem.id.equals(req.params.user_id)){
							foundIndex = index ;
						}
					})
					if(foundIndex!=-1){
						foundEvent.pendingRequests.splice(foundIndex,1);
						foundEvent.save();
						res.redirect("back");	
					}else{
						res.send("No user found");
					}
				}
			})
		}
	})
})

//User sending request
router.post("/events/:id/requests",isLoggedIn,function(req,res){
	Event.findById(req.params.id).populate("owner").exec(function(err,foundEvent){
		if(err&!foundEvent){
			console.log("Not found");
			req.flash("error","Cannot find event");
			res.redirect("/events");
		}
		else{
			if(foundEvent.type.toLowerCase()=="private"){
				var requestee = {
					id  : req.user._id,
					name: req.user.username
				}
			foundEvent.pendingRequests.push(requestee);
			if(req.body.count==1){
				foundEvent.owner.notifications.push(req.user.username + " wants to join " + foundEvent.name);	
			}
			else{
				foundEvent.owner.notifications.push(req.user.username + " wants to join " + foundEvent.name + " with " + (req.body.count-1).toString() + " other(s)." );
			}	
			foundEvent.owner.newNotifications+=1;
			foundEvent.owner.save();
			foundEvent.save();   
			}
			else{
				User.findById(req.user._id,function(err,foundUser){
					if(err){
						console.log(err);
					}
					else{
						foundUser.invited.push(foundEvent._id);
						foundUser.notifications.push("You have been invited to "  + foundEvent.name);
						foundUser.newNotifications+=1;
						foundUser.save();
						foundEvent.invitees.push(foundUser._id);
						if(req.body.count!=1){
							foundEvent.owner.notifications.push(req.user.username+" joins "+foundEvent.name+" with "+(req.body.count-1).toString()+" other(s)");
						}
						else{
							foundEvent.owner.notifications.push(req.user.username + " joins " + foundEvent.name);
						}
						foundEvent.count+=Number(req.body.count);
						foundEvent.save();
						console.log(foundEvent,req.body.count);
						foundEvent.owner.newNotifications+=1;
						foundEvent.owner.save();
					}
				})
			}
		}
	})
	res.redirect("back");
})


function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error","Please Login First!");
	res.redirect("/login");
}

function isOwner(req,res,next){
	if(req.isAuthenticated()){
		Event.findById(req.params.id).populate("owner").exec(function(err,foundEvent){
			if(err){
				console.log(err);
				req.flash("error","Event does not exist!");
				res.redirect("/events");
			}else{
				if(foundEvent.owner.equals(req.user._id)){
					return next();
				}else{
					console.log("no");
					req.flash("error","You are not authorized to do that");
					res.redirect("/events");
				}
			}
		})
	}else{
		req.flash("error","Please Login First");
		res.redirect("/login");
	}
}

module.exports = router ;
