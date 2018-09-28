require('dotenv').config();

var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    mongoose = require("mongoose"),
    flash = require("connect-flash"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    reviewRoutes = require("./routes/reviews"),
    User = require("./models/user"),
    seedDB = require("./seeds")


//requiring routes
var commentRoutes = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes = require("./routes/index"),
    userRoutes = require("./routes/users")


app.locals.moment = require('moment');
app.locals.noMatch = undefined; //our search modal 

var url = process.env.DATABASEURL || "mongodb://localhost/yelpFinal"
mongoose.connect(url);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(session({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));



passport.use(new LocalStrategy(User.authenticate()));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});



app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/users", userRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);


//Wildcard route and handler

app.get("/*", function(req, res) {
    res.redirect("/");
});

var port = 2200;

app.listen(port, function() {
    console.log('YelpCamp Server has started');
});

// app.listen(process.env.PORT, process.env.IP, function() {
//     console.log('YelpCamp Server has started');
// });