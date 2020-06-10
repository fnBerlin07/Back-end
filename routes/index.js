var express	= require("express"),
	router	= express.Router(),
	Event	= require("../models/event.js"),
	User	= require("../models/user.js"),
	passport= require("passport");	

//Dashboard
router.get("/user/:id",isLoggedIn,function(req,res){
	if(req.user._id.equals(req.params.id)){
		User.findById(req.params.id).populate('invited owner receivedInvites').exec(function(err,user){
			if(err){
				console.log("error");
				return res.redirect("/");
			}
			Event.find({}).populate("pendingRequests").exec(function(err,allEvents){
				if(err){
					console.log(err);
				}
				else{
					res.render("profile",{user:user,allEvents:allEvents});
				}
			})	
		})
	}
	else{
		req.flash("error","You cannot do that!");
		res.redirect("/");
	}
});

router.get("/user/:id/notifications",isLoggedIn,function(req,res){
	if(req.user._id.equals(req.params.id)){
	User.findById(req.params.id,function(err,foundUser){
		if(err){
			console.log(err);
		}
		else{
			res.render("notifications",{user:foundUser});
		}
	})
	}
	else{
		req.flash("error","You cannot do that!");
		res.redirect("/");
	}
	
})
	
router.post("/user/:id/notifications",isLoggedIn,function(req,res){
	if(req.user._id.equals(req.params.id)){
	User.findById(req.params.id,function(err,foundUser){
		if(err){
			console.log(err);
		}
		else{
			foundUser.newNotifications=0;
			foundUser.save();
			res.redirect("back");
		}
	})
	}
	else{
		req.flash("error","You cannot do that!");
		res.redirect("/");
	}
	
})

//Sign Up Form
router.get("/register",function(req,res){
	res.render("register");
})

//Signed Up
router.post("/register",function(req,res){
	var newUser = new User({username:req.body.username,newNotifications:0});
	User.register(newUser,req.body.password,function(err,user){
		if(err){
			console.log(err);
			req.flash("error",err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req,res,function(){
			user.notifications.push("Welcome to D-Event!");
			user.newNotifications+=1;
			user.save();
			req.flash("success","Welcome to D-Event "+user.username );
			res.redirect("/events");
		})
	})
})


//Login form
router.get("/login",function(req,res){
	res.render("login");
})

//Logged In
router.post("/login",passport.authenticate("local",
	{
	successRedirect:"/events",
	failureRedirect:"/login",
}) ,function(req,res){});

//Logged Out
router.get("/logout",function(req,res){
	req.flash("success","Logged Out");
	req.logout();
	res.redirect("/");
})

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error","Please Login First");
	res.redirect("/login");
}

module.exports = router ;
