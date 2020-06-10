//packages
var express 	   = require("express"),
	bodyParser     = require("body-parser"),
	mongoose       = require("mongoose"),
	passport	   = require("passport"),
	flash	       = require("connect-flash"),
	sanitizeHtml   = require("sanitize-html"),
	sanitizer      = require("express-sanitizer"),
 	LocalStrategy  = require("passport-local"),
	methodOverride = require("method-override"),
	Event          = require("./models/event.js"),
	User	       = require("./models/user.js");
	
var eventRoute     = require("./routes/events.js");
var authRoute	   = require("./routes/index.js");

var app = express();

// DB is empty initially!
mongoose.connect('mongodb://localhost:/app_v16_final', {
	useNewUrlParser:true, 
	useUnifiedTopology: true,
});

app.use(express.static(__dirname + '/public'));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(sanitizer());
app.use(flash());
app.use(methodOverride("_method"));

app.use(require("express-session")({
	secret: "This is a secret",
	resave: false,
	saveUninitialized :false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser  	= req.user;
	res.locals.success       	= req.flash("success");
	res.locals.error         	= req.flash("error");	
	next();
});

app.get("/",function(req,res){
	res.render("landing");
})

app.use(eventRoute);
app.use(authRoute);

app.get("*",function(req,res){
	res.send("Please check your url");
})

app.listen(process.env.PORT||4000,process.env.IP,function(req,res){
	console.log("Event listing App's Server has been started!");
})