var express = require("express");
var router = express.Router({ mergeParams: true });
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Comments New
router.get("/new", middleware.active, middleware.fuzzySearch, function(req, res) {
    // find campground by id
    Campground.findById(req.params.id, function(err, campground) {
        if (err || !campground || campground.length === 0) {
            req.flash("err", "Sorry, something went wrong.");
            res.redirect("back");
        } else {
            res.render("comments/new", { campground: campground });
        }
    });
});

//Comments Create
router.post("/", middleware.active, function(req, res) {
    //validate comment
    req.check("comment[text]", "Comment is required").not().isEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
        req.flash("error", errors[0].msg);
        res.redirect("back");

    } else {

        req.session.success = true;

        //lookup campground using ID
        Campground.findById(req.params.id, function(err, campground) {
            if (err || !campground) {
                req.flash("err", "Sorry, something went wrong.")
                res.redirect("back")
            } else {
                // req.body.comment_sanitized = req.sanitize(req.body.comment.text);
                //console.log(req.body);
                Comment.create(req.body.comment, function(err, comment) {
                    if (err) {
                        req.flash("error", "Sorry, something went wrong");
                        console.log(err);
                    } else {
                        //add username and id to comment
                        comment.author.id = req.user._id;
                        comment.author.username = req.user.username;
                        //save comment
                        comment.save();
                        campground.comments.push(comment);
                        campground.save(function(err, campground) {
                            if (err) {
                                console.log(err);
                                req.flash("error", "Comment could not be added");
                                res.redirect('back');
                            } else {
                                req.flash("success", "Successfully added comment");
                                res.redirect('/campgrounds/' + campground._id);
                            }
                        });
                    }
                });
            }
        });
    }
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.active, middleware.fuzzySearch, middleware.checkCommentOwnership, function(req, res) {
    Comment.findById(req.params.comment_id, function(err, foundComment) {
        if (err || !foundComment) {
            req.flash("err", "Sorry, something went wrong")
            res.redirect("back")
        } else {
            res.render("comments/edit", { campground_id: req.params.id, comment: foundComment });
        }
    });
});

// COMMENT UPDATE
router.put("/:comment_id", middleware.active, middleware.checkCommentOwnership, function(req, res) {
    //validate comment
    req.check("comment[text]", "Comment is required").not().isEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
        req.flash("error", errors[0].msg);
        res.redirect("back");

    } else {

        req.session.success = true;

        Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment) {
            if (err) {
                req.flash("err", "Sorry, something went wrong.")
                res.redirect("back")
            } else {
                req.flash("success", "Comment successfully updated");
                res.redirect("/campgrounds/" + req.params.id);
            }
        });
    }
});



// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.active, middleware.checkCommentOwnership, function(req, res) {
    //findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err) {
        if (err) {
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});



module.exports = router;