var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");


//Configure Multer and Cloudinary
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function(req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter })

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'dr5dxb4nl',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


//Index
router.get("/", middleware.fuzzySearch, function(req, res) {
    User.find().where("active").equals(true).exec(function(err, users) {
        if (err || users.length === 0) {
            console.log(err);
            req.flash("error", "Sorry, that user could not be found");
        } else {
            res.render("users/index", { users: users });
        }
    });
});

//Route for email form
router.get("/mailinglist/form", middleware.isLoggedIn, function(req, res) {
    //Only admins can use this route
    if (req.user.isAdmin) {
        res.render("mailinglistform");
    } else {
        req.flash("error", "Sorry, this feature is reserved for administrators");
        res.redirect("/campgrounds");
    }
});

//Route to collect email data
router.post("/mailinglist", middleware.isLoggedIn, function(req, res) {
    //Only admins can use this route
    if (req.user.isAdmin) {
        //Backend Validation:
        if (req.body.email === '' || req.body.subject === '') {
            req.flash("error", "Please provide a message to be disseminated.");
            res.redirect("back");
        } else {
            //store email message and subject
            var emailBody = req.body.email;
            var emailSubject = req.body.subject;
            //construct list of users to email and email them
            constructMailingListAndMail(req, res, emailRoutine, emailBody, emailSubject);
        }
    } else {
        req.flash("error", "Sorry, this feature is reserved for administrators");
        res.redirect("/campgrounds");
    }
});

//function to find users that have varified email addresses and that have accepted newsletters.
function constructMailingListAndMail(req, res, emailRoutine, emailBody, emailSubject) {
    User.find().where("emailIsVerified").equals(true).exec(function(err, foundUsers) {
        if (err || foundUsers.length === 0) {
            req.flash("error", "Sorry, something went wrong. Please try again");
            return res.redirect("back");
        }

        //find users that have signed up for newsletter
        foundUsers.forEach(function(user) {
            if (user.newsletterIsAccepted) {
                emailRoutine(req, res, user, emailBody, emailSubject);
            }
        });
    });
}

//email mailinglist
function emailRoutine(req, res, user, emailBody, emailSubject) {
    var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'yelpcampemailreset@gmail.com',
            pass: process.env.GMAILPW
        }
    });
    var mailOptions = {
        to: user.email,
        from: 'yelpcampemailreset@gmail.com',
        subject: emailSubject,
        text: emailBody

    };
    smtpTransport.sendMail(mailOptions, function(err) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        req.flash("success", "Email sent to mailing list");
        res.redirect("/campgrounds");
    });
}












//Show User: 
router.get("/:id", middleware.fuzzySearch, function(req, res) {

    User.findById(req.params.id, function(err, user) {
        if (err || !user) {
            console.log("triggered")
            req.flash("error", "sorry, that user could not be found");
            res.redirect("back");
        } else {

            //find campgrounds for my user, and pass to my views, to display
            Campground.find().where("author.id").equals(user._id).exec(function(err, myCampgrounds) {
                if (err) {
                    console.log(err)
                } else {
                    res.render("users/show", { user: user, campgrounds: myCampgrounds });
                }
            });
        }
    });
});


//Edit user
router.get("/:id/edit", middleware.active, middleware.checkUserOwnership, middleware.checkUserOwnership, middleware.fuzzySearch, function(req, res) {
    User.findById(req.params.id, function(err, user) {
        if (err || !user) {
            req.flash("error", "sorry, that user could not be found");
            res.redirect("back");
        } else {
            res.render("users/edit", { user: user });
        }
    });
});

//Update user
router.put("/:id", middleware.active, middleware.checkUserOwnership, upload.single('image'), function(req, res) {
    User.findById(req.params.id, function(err, user) {
        if (err || !user) {
            req.flash("error", "Sorry, something went wrong, please try again.");
            res.redirect("back");
        } else {
            //Determine if new image or existing one already saved to user document
            if (user.avatar.name !== req.file.originalname) {

                cloudinary.uploader.upload(req.file.path, function(result) {

                    // add cloudinary url and image original name to the campground object
                    var imageUpload = { url: result.secure_url, name: req.file.originalname }
                    req.body.user.avatar = imageUpload;

                    //Error handling, ensure image could be uploaded
                    if (req.body.user.avatar.url) {

                        //Update user document
                        updateUser(req, res);
                    } else if (req.body.user.avatar.url === undefined) {
                        //Error handling, if image could not be uploaded
                        req.flash("error", "Sorry, there is something wrong with that image, please try a different one.");
                        res.redirect("back");
                    }
                });
            } else {
                //Update user
                updateUser(req, res);
            }
        }
    });
});


//update user helper function
function updateUser(req, res) {
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, user) {
        if (err || !user) {
            console.log(err);
            req.flash("error", "Sorry, could not update this user");
            res.redirect("back");
        } else {
            //Make Admin from edit user form if admin code correct 
            if (req.body.user.admin === "admin123") {
                user.isAdmin = true;
                user.save();
            }
            req.flash("success", "User successfully updated");
            res.redirect("/users/" + req.params.id);
        }
    });
}

//Deactivate user
router.get("/:id/deactivate", function(req, res) {
    if (req.query.deactivate) {
        User.findById(req.params.id, function(err, user) {
            if (err || !user) {
                req.flash("err", "Sorry, something went wrong, please try again");
                res.redirect("back");
            } else {
                user.active = false;
                user.save();
                res.redirect("/logout");
            }
        });
    }
});


//validate user's email address
router.get("/:id/verify", function(req, res) {
    //res.send(req.query);

    User.findOne({ _id: req.query.userID }, function(err, user) {
        if (err || !user) {
            console.log(err);
            req.flash("error", "Sorry, something went wrong");
            res.redirect("/campgrounds");
        } else {
            if (user.emailIsVerified) {
                req.flash("success", "This email has already been verified.");
                return res.redirect("/campgrounds");
            }
            user.emailIsVerified = true;
            user.save();
            req.flash("success", "Thank you " + user.username + ". Your email has been verified.");
            res.redirect("/campgrounds");
        }
    });
});





module.exports = router;