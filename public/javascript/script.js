//document ready ensures DOM is loaded before our js runs (even if link to js put in head)
$(document).ready(function() {
    init();

});

function init() {
    validateRegisterForm();
    validateUserEditForm();
    validateNewCampground();
    validateEditCampground();
    validateNewComment();
    validateEditComment();

}


//Validate registration form
function validateRegisterForm(errmessage) {

    $("#signUpButton").on("click", function(event) {
        event.preventDefault();
        var usernameText = $.trim($("#username").val());
        var passwordText = $.trim($("#password").val());
        var firstnameText = $.trim($("#firstName").val());
        var surnameText = $.trim($("#surname").val());
        var emailText = $.trim($("#email").val());
        var image = $.trim($("#image").val());


        if (!usernameText) {
            errmessage = "Please enter a username";
            $("div.alert.alert-warning").fadeIn(200);
            $("h4.err").remove();
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }
        //
        //regex of conditional 5-10 characters
        if (!passwordText || passwordText.length < 5 || passwordText.length > 9) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Password needs to be between 5 to 10 characters";
            $("div.alert.alert-warning").fadeIn(200);
            $("h4.err").remove();
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        if (!firstnameText) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please enter a first name";
            $("div.alert.alert-warning").fadeIn(200);
            $("h4.err").remove();
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        if (!surnameText) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please enter a surname";
            $("div.alert.alert-warning").fadeIn(200);
            $("h4.err").remove();
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        //regex om email address te validate
        if (!ValidateEmail(emailText)) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please enter an email address";
            $("div.alert.alert-warning").fadeIn(200);
            $("h4.err").remove();
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }
        if (!image) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please provide an avatar image";
            $("div.alert.alert-warning").fadeIn(200);
            $("h4.err").remove();
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        $("h4.err").remove();
        $("div.alert.alert-warning").fadeOut(200);
        $("#userSignUp").submit();
    });
}



//Validate update user form
function validateUserEditForm(errmessage) {

    $("#userUpdateButton").on("click", function(event) {
        event.preventDefault();
        var firstnameText = $.trim($("#firstName").val());
        var surnameText = $.trim($("#surname").val());
        var emailText = $.trim($("#email").val());
        var avatar = $.trim($("#image").val());

        if (!firstnameText) {
            errmessage = "Please enter a first name";
            $("div.alert.alert-warning").fadeIn(200);
            $("h4.err").remove();
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        if (!surnameText) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please enter a surname";
            $("div.alert.alert-warning").fadeIn(200);
            $("h4.err").remove();
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        //regex om email address te validate
        if (!ValidateEmail(emailText)) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please enter an email address";
            $("div.alert.alert-warning").fadeIn(200);
            $("h4.err").remove();
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        if (!avatar) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please provide an avatar";
            $("div.alert.alert-warning").fadeIn(200);
            $("h4.err").remove();
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }
        $("h4.err").remove();
        $("div.alert.alert-warning").fadeOut(200);
        $("#userUpdate").submit();
    });
}


function ValidateEmail(mail) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($("#email").val())) {
        return true;
    }
    return false;
}


//Validate Campground Forms
//New Campground

function validateNewCampground(errmessage) {
    $("#campgroundNewButton").on("click", function(event) {
        event.preventDefault();
        var campgroundName = $.trim($("#name").val());
        var campgroundImage = $.trim($("#imageUrl").val());
        var campgroundPrice = $.trim($("#price").val());
        var campgroundDescription = $.trim($("#description").val());
        var campgroundLocation = $.trim($("#location").val());

        if (!campgroundName) {
            errmessage = "Please enter a campground name";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>");
            return
        }

        if (!campgroundImage) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please provide an image";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>");
            return
        }

        if (!campgroundPrice) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please provide a price";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        if (!campgroundDescription) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please provide a description";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        if (!campgroundLocation) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please provide a location";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        $("h4.err").remove();
        $("div.alert.alert-warning").fadeOut(200);
        $("#campgroundNew").submit();
    });

}


//Edit campground
function validateEditCampground(errmessage) {

    $("#editCampgroundButton").on("click", function(event) {
        event.preventDefault();
        var campgroundName = $.trim($("#name").val());
        var campgroundImage = $.trim($("#imageUrl").val());
        var campgroundPrice = $.trim($("#price").val());
        var campgroundDescription = $.trim($("#description").val());
        var campgroundLocation = $.trim($("#location").val());

        if (!campgroundName) {
            errmessage = "Please enter a campground name";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>");
            return
        }

        if (!campgroundImage) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please provide an image";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>");
            return
        }

        if (!campgroundPrice) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please provide a price";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        if (!campgroundDescription) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please provide a description";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        if (!campgroundLocation) {
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeOut(200);
            errmessage = "Please provide a location";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>")
            return
        }

        $("h4.err").remove();
        $("div.alert.alert-warning").fadeOut(200);
        $("#editCampground").submit();
    });
}


//Validate new comment form

function validateNewComment(errmessage) {

    $("#newCommentButton").on("click", function(event) {
        event.preventDefault();
        var commentText = $.trim($("#commentText").val());

        if (!commentText) {
            errmessage = "Please provide a comment";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>");
            return
        }
        $("h4.err").remove();
        $("div.alert.alert-warning").fadeOut(200);
        $("#newComment").submit();
    });
}


//Validate update comment form


function validateEditComment(errmessage) {

    $("#editCommentButton").on("click", function(event) {
        event.preventDefault();
        var commentText = $.trim($("#commentText").val());


        if (!commentText) {
            errmessage = "Please provide a comment";
            $("h4.err").remove();
            $("div.alert.alert-warning").fadeIn(200);
            $("div.alert.alert-warning").append("<h4 class='err'>" + errmessage + "</h4>");
            return
        }
        $("h4.err").remove();
        $("div.alert.alert-warning").fadeOut(200);
        $("#editComment").submit();
    });
}

$("#newsletterCheckbox").on("click", function() {
    $(this).fadeOut(1);
    $("#newsletterCheckboxChecked").fadeIn(1);
    $("#newsletter").prop("checked", true);
});

$("#newsletterCheckboxChecked").on("click", function() {
    $(this).fadeOut(1);
    $("#newsletterCheckbox").fadeIn(1);
    $("#newsletter").prop("checked", false);
});