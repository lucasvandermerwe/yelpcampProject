var express = require("express");
var router = express.Router();
var passport = require("passport");
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

//root route
router.get("/", middleware.fuzzySearch, function(req, res) {
    res.render("landing");
});

// show register form
router.get("/register", function(req, res) {
    res.render("register", { page: 'register' });
});


//handle sign up logic
router.post("/register", upload.single('image'), function(req, res) {
    //backend validation of inputs 
    req.check("username", "Please provide desired username").not().isEmpty();
    req.check("password", "Password needs to me atleast 5 characters").isLength({ min: 5 }).equals(req.body.confirm_password);
    req.check("firstname", "Please provide your first name").not().isEmpty();
    req.check("surname", "Please provide your surname").not().isEmpty();
    req.check("email", "Please provide a valid email address").isEmail();

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
        req.flash("error", errors[0].msg);
        return res.redirect("back");
    }

    if (req.file === undefined) {
        req.flash("error", "Image cannot be left blank");
        return res.redirect("back");
    }

    req.session.success = true;

    var newUser = new User({
        username: req.body.username,
        firstname: req.body.firstname,
        surname: req.body.surname,
        email: req.body.email,
        description: req.body.description
    });
    //if isAdmin code provide
    if (req.body.admin === "admin123") {
        newUser.isAdmin = true
    }

    if (req.body.acceptnewsletter === "true") {
        newUser.newsletterIsAccepted = true;
    }


    //If Avatar image provided 
    if (req.file) {
        cloudinary.uploader.upload(req.file.path, function(result) {
            console.log(req.file);
            // add cloudinary url and image original name to the campground object
            var imageUpload = { url: result.secure_url, name: req.file.originalname }
            newUser.avatar = imageUpload;

            //if image successfully added to newUser document
            if (newUser.avatar) {
                singUpRoutine(req, res, newUser, validateEmail);

                //if image cannot be uploaded to newUser document
            } else if (newUser.avatar === undefined) {
                req.flash("error", "Sorry, there is something wrong with that image, please try a different one.");
                res.redirect("back");
            }
        });
    } else {
        //if avatar image not provided
        singUpRoutine(req, res, newUser);
    }

});


//Register User, Authenticate User and Send Email to user - to verify email address .
function singUpRoutine(req, res, newUser, validateEmail) {

    User.register(newUser, req.body.password, function(err, user) {
        //Error message to user
        if (err) {
            if (err.code === 11000) {
                return res.render("register", { error: "Sorry, that email address is associated with a different profile" });
            } else {
                return res.render("register", { error: err.message });
            }
        } else {
            passport.authenticate("local")(req, res, function() {
                validateEmail(req, res, user);
            });
        }
    });
}

//Send email to newly registered user - in order to verify email address 

function validateEmail(req, res, user) {
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
        subject: 'Yelpcamp - Please verify your email',
        text: 'You are receiving this in order to verify your email address\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'https://lukeyelpcamp.herokuapp.com/users/:id/verify?verify=true&&userID=' + user._id

    };
    smtpTransport.sendMail(mailOptions, function(err) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
    });
    req.flash("success", "Welcome to YelpCamp " + user.username + " . Please verify your email via the link we have emailed to " + user.email);
    res.redirect("/campgrounds");
}


//show login form
router.get("/login", function(req, res) {
    res.render("login", { page: 'login' });
});

//handling login logic
router.post("/login", middleware.validateLogin, middleware.reactivateUser, passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
}), function(req, res) {});

// logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});



// forgot password
router.get('/forgot', middleware.active, function(req, res) {
    res.render('forgot');
});

router.post('/forgot', middleware.active, function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                if (err || !user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    if (err) {
                        req.flash('error', err.message);
                        return res.redirect('back');
                    }
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
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
                subject: 'Node.js Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

router.get('/reset/:token', middleware.active, function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/forgot');
        }
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', { token: req.params.token });
    });
});

router.post('/reset/:token', middleware.active, function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function(err) {
                        if (err) {
                            req.flash('error', err.message);
                            return res.redirect('back');
                        }

                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function(err) {
                            if (err) {
                                req.flash('error', err.message);
                                return res.redirect('back');
                            }
                            req.logIn(user, function(err) {
                                if (err) {
                                    req.flash('error', err.message);
                                    return res.redirect('back');
                                }
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        },
        function(user, done) {
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
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], function(err) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        res.redirect('/campgrounds');
    });
});


module.exports = router;