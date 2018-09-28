var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middleware = require("../middleware");
var User = require("../models/user");
//Config for image upload functionality
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

//Configure google maps api

var NodeGeocoder = require('node-geocoder');

var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = NodeGeocoder(options);


//INDEX - show all campgrounds
router.get("/", middleware.fuzzySearch, function(req, res) {
    //add currentUser as session variable (make it available in all routes) 
    if (req.user) {
        req.session.user = { userID: req.user.id, username: req.user.username };
    }
    //pagination
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var currentPage = pageQuery ? pageQuery : 1;

    // Get all campgrounds from DB
    Campground.find({}).skip((currentPage * perPage) - perPage).limit(perPage).exec(function(err, allCampgrounds) {
        Campground.count().exec(function(err, count) {
            if (err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", {
                    campgrounds: allCampgrounds,
                    page: 'campgrounds',
                    pages: Math.ceil(count / perPage),
                    current: currentPage,
                    haveSearched: false
                });
            }
        });
    });
});



//CREATE - add new campground to DB
router.post("/", middleware.active, middleware.fuzzySearch, upload.single('image'), function(req, res) {
    //backend validation
    req.check("campground[name]", "Please provide campground name").not().isEmpty();
    req.check("campground[price]", "Please provide price").not().isEmpty();
    req.check("campground[description]", "Please provide a description").not().isEmpty();
    req.check("campground[location]", "Please provide a location").not().isEmpty();

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

    //upload image to cloudinary
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if (err) {
            req.flash("error", "Sorry, that image couldn't be uploaded. Please try a different one.");
            return res.redirect("back");
        }
        var imageUpload = { url: result.secure_url, name: req.file.originalname, publicID: result.public_id }
        req.body.campground.image = imageUpload;

        //Error handling - if image not uploaded successfully 
        if (req.body.campground.image.url === undefined) {
            req.flash("error", "Sorry, something went wrong with that image, please pick a different one.");
            res.redirect("back");
        } else if (req.body.campground.image.url) {
            //if image successfully uploaded then:  
            // add author to campground
            req.body.campground.author = {
                    id: req.user._id,
                    username: req.user.username
                }
                //add coordinates to our campground's map
                //in the updateMap function the "create"
                //will trigger the block of code to create new campground             
            updateMap(req, res, "create");
        }

    });


});

//NEW - show form to create new campground
router.get("/new", middleware.active, middleware.fuzzySearch, function(req, res) {
    res.render("campgrounds/new");
});


// SHOW - shows more info about one campground
router.get("/:id", middleware.fuzzySearch, function(req, res) {

    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: { sort: { createdAt: -1 } }
    }).exec(function(err, foundCampground) {
        if (err || !foundCampground) {
            //console.log(err);
            req.flash("error", "Sorry, that campground could not be found");
            res.redirect("/campgrounds");
        } else {
            res.render("campgrounds/show", { campground: foundCampground });
        }
    });
});


// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.active, middleware.checkCampgroundOwnership, middleware.fuzzySearch, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        res.render("campgrounds/edit", { campground: foundCampground });
    });
});


// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.active, middleware.checkCampgroundOwnership, upload.single('image'), function(req, res) {
    //backend validation
    req.check("campground[name]", "Please provide campground name").not().isEmpty();
    req.check("campground[price]", "Please provide price").not().isEmpty();
    req.check("campground[description]", "Please provide a description").not().isEmpty();
    req.check("campground[location]", "Please provide a location").not().isEmpty();

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



    //protects our rating input from being manipulated
    delete req.body.campground.rating;

    Campground.findById(req.params.id, function(err, campground) {
        if (err || !campground) {
            console.log(err);
            req.flash("error", "Sorry, something went wrong");
            res.redirect("back");
        } else {
            //if old image and new location
            if (campground.image.name === req.file.originalname && req.body.campground.location !== campground.location) {
                updateMap(req, res, "update");
                //if old image and old location
            } else if (campground.image.name === req.file.originalname && req.body.campground.location === campground.location) {
                updateCampground(req, res);
                //if new image but old location  
            } else if (campground.image.name !== req.file.originalname && req.body.campground.location === campground.location) {
                //upload image to cloudinary
                cloudinary.uploader.upload(req.file.path, function(result) {
                    var imageUpload = { url: result.secure_url, name: req.file.originalname, publicID: result.publicID }
                    req.body.campground.image = imageUpload;

                    //Error handling - if image not uploaded successfully 
                    if (req.body.campground.image.url === undefined) {
                        req.flash("error", "Sorry, something went wrong with that image, please pick a different one.");
                        res.redirect("back");
                    } else if (req.body.campground.image.url) {
                        updateCampground(req, res);
                    }
                });

                //if new image and new location 
            } else if (campground.image.name !== req.file.originalname && req.body.campground.location !== campground.location) {
                //upload image to cloudinary
                cloudinary.uploader.upload(req.file.path, function(result) {
                    var imageUpload = { url: result.secure_url, name: req.file.originalname }
                    req.body.campground.image = imageUpload;

                    //Error handling - if image not uploaded successfully
                    if (req.body.campground.image.url === undefined) {
                        req.flash("error", "Sorry, something went wrong with that image, please pick a different one.");
                        res.redirect("back");
                    } else if (req.body.campground.image.url) {
                        updateMap(req, res, "update");
                    }
                });
            }
        }
    });
});


//Update map - add location to campground
function updateMap(req, res, todo) {
    geocoder.geocode(req.body.campground.location, function(err, data) {
        if (err || !data.length) {
            console.log(err);
            req.flash('error', "Map couldn't be populated, please try again");
            return res.redirect('back');
        }

        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        var location = data[0].formattedAddress;

        //update campground, will only happen if function call sent from update campground route
        if (todo === "update") {
            updateCampground(req, res);
        }
        //create a new campground - from campground create route
        if (todo === "create") {
            Campground.create(req.body.campground, function(err, newlyCreated) {
                if (err || !newlyCreated) {
                    console.log(err);
                    req.flash("error", "Error occured while creating campground");
                    res.redirect("back");
                } else {
                    req.flash("success", "Campground Successfully added")
                    res.redirect("/campgrounds");
                }
            });
        }
    });
}


//Update Campground
function updateCampground(req, res) {
    //update campground with fully compiled document    
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
        if (err) {
            req.flash("error", "Oops, something went wrong");
            res.redirect("back");
        } else {
            //redirect somewhere(show page)
            req.flash("success", "Campground successfully updated");
            res.redirect("/campgrounds/" + req.params.id);
        };
    });
}


// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.active, middleware.checkCampgroundOwnership, middleware.active, function(req, res) {

    //remove image from cloudinary 
    Campground.findById(req.params.id, async function(err, campground) {
        if (err || !campground) {
            req.flash("error", "Oops, something went wrong");
            res.redirect("back");
        } else {
            try {
                await cloudinary.v2.uploader.destroy(campground.image.publicID);
            } catch (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //remove campground out of user's liked
            User.find({}, function(err, foundUsers) {
                if (err) {
                    req.flash("error", "Oops, something went wrong");
                    return res.redirect("back");
                }
                var indexToRemove;
                foundUsers.forEach(function(user, index, array) {
                    indexToRemove = user.liked.findIndex(function(likedCampground) {
                        return likedCampground.id.equals(campground._id);
                    });
                    user.liked.splice(indexToRemove, 1);
                    user.save();
                    if (index === array.length - 1) {
                        completeDeleteRoutine();
                    }
                });
            });


            function completeDeleteRoutine() {
                //delete all comments associated with the campground  
                Comment.remove({ "_id": { $in: campground.comments } }, function(err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    // deletes all reviews associated with the campground
                    Review.remove({ "_id": { $in: campground.reviews } }, function(err) {
                        if (err) {
                            console.log(err);
                            return res.redirect("/campgrounds");
                        }

                        //delete the campground
                        campground.remove();
                        req.flash("success", "Campground deleted successfully!");
                        res.redirect("/campgrounds");
                    });
                });
            }
        }
    });
});


//Like/unlike campground

router.get("/:id/like", middleware.active, function(req, res) {

    User.findById(req.user._id).exec(function(err, user) {
        if (err || !user) {
            req.flash("error", "Oops, something went wrong");
            res.redirect("back");
        } else {

            //check whether liked before
            var likedBefore = user.liked.findIndex(function(liked) {
                return liked.id.equals(req.params.id);
            });

            //liked before, need to unlike
            if (likedBefore !== -1) {
                user.liked.splice(likedBefore, 1);
                user.save()
                req.flash("success", "Campground Unliked");
                res.redirect("back");
            } else {

                //a new like, need to like    
                Campground.findById(req.params.id, function(err, campground) {

                    var campgroundObj = { id: campground._id, name: campground.name }

                    if (err || !campground) {
                        req.flash("error", "Oops, something went wrong");
                        res.redirect("back");
                    } else {
                        user.liked.push(campgroundObj);
                        user.save();
                        req.flash("success", "Campground Liked")
                        res.redirect("back");
                    }
                });
            }
        }
    });

});








module.exports = router;



module.exports = router;