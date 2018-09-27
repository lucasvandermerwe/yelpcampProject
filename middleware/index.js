var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user");
var passport = require("passport");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var Review = require("../models/review");


// all the middleare goes here
var middlewareObj = {};


middlewareObj.checkCampgroundOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id, function(err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found");
                res.redirect("back");
            } else {
                // does user own the campground?
                if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if (err || !foundComment) {
                req.flash("error", "Comment not found");
                res.redirect("back");
            } else {
                // does user own the comment?
                if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}


middlewareObj.fuzzySearch = function(req, res, next) {
    if (!req.query.search) {
        next();
    } else {
        var noMatch;
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        //Search campground name
        Campground.find({ "name": regex }).exec(function(err, foundCampgrounds) {
            if (err || foundCampgrounds.length === 0) {
                //if campground name not found, we look for author name
                User.find({ "username": regex }).where("active").equals(true).exec(function(err, users) {
                    if (err || users.length === 0) {
                        noMatch = "Sorry, that search yielded no results, please try again";
                        res.render("campgrounds/index", { campgrounds: [], noMatch: noMatch, haveSearched: true });

                    } else {
                        res.render("users/index", { users: users });
                    }
                });
            } else {
                res.render("campgrounds/index", { campgrounds: foundCampgrounds, haveSearched: true });
            }
        });
    }
}


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//check whether user's profile is active
middlewareObj.active = function active(req, res, next) {
    //Check whether logged in
    if (req.isAuthenticated()) {
        User.findById(req.user._id, function(err, user) {
            if (err || !user) {
                req.flash("error", "Sorry, something went wrong, please try again.");
                res.redirect("back");
            } else {
                if (user.active) {
                    next();
                } else {
                    req.flash("error", "Your account has been deactivated.  Reactivate by logging in.")
                    res.redirect("/login")
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that.");
        res.redirect("/login");
    }


};

//Reactivate user's account on login
middlewareObj.reactivateUser = function(req, res, next) {
    User.findOne({ username: req.body.username }, function(err, user) {
        if (err || !user) {
            if (err) {
                req.flash("error", "Sorry, something went wrong, please try again.");
                res.redirect("back");
            }
            if (!user) {
                req.flash("error", "Sorry, that username does not exist, please try again.");
                res.redirect("back");
            }

        } else {
            user.active = true;
            user.save();
            next();
        }
    });
}


//Ensure that user can only manipulate user object if it belongs to current user
middlewareObj.checkUserOwnership = function(req, res, next) {
    //Check whether logged in
    if (req.isAuthenticated()) {
        User.findById(req.params.id, function(err, user) {
            if (err) {
                req.flash("error", "Sorry, something went wrong, please try again.");
                res.redirect("back");
            } else {
                var foundUserID = user._id;
                var currentUserID = req.user._id;
                if (foundUserID.equals(currentUserID)) {
                    next();
                } else {
                    req.flash("error", "Sorry, permission denied.")
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Sorry, you need to be logged in to do that.")
        res.redirect("/login");
    }
};


middlewareObj.checkReviewOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Review.findById(req.params.review_id, function(err, foundReview) {
            if (err || !foundReview) {
                res.redirect("back");
            } else {
                // does user own the comment?
                if (foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function(req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id).populate("reviews").exec(function(err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundCampground.reviews
                var foundUserReview = foundCampground.reviews.some(function(review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("back");
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

middlewareObj.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

module.exports = middlewareObj;