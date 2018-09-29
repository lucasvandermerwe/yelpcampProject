$(document).ready(function() {
    init();
    setBinds();
});

function setBinds() {
    $("#newsletterCheckbox").off("click").on("click", newsletterCheckboxChecked);
    $("#newsletterCheckboxChecked").off("click").on("click", newsletterCheckboxUnchecked);
}

function init() {
    $.validator.setDefaults({
        errorPlacement: function(error, element) {
            error.appendTo(element.parent());
        },
        highlight: function(element) {
            console.log(element);
            $(element).closest(".form-group").addClass("was-validated");
        },
        unhighlight: function(element) {
            console.log(element);
            $(element).closest(".form-group").removeClass("was-validated");
        }
    });

    $("#newComment").validate();
    $("#editComment").validate();
    $("#userSignUp").validate({
        rules: {
            username: "required",
            firstname: "required",
            surname: "required",
            image: "required",
            password: {
                required: true,
                minlength: 5
            },
            confirm_password: {
                required: true,
                minlength: 5,
                equalTo: "#password"
            },
            required: true,
            email: {
                email: true
            }
        },
        messages: {
            firstname: "Pleae enter a first name",
            surname: "Please enter your surname",
            username: "Please enter a username",
            image: "Please provide an avatar image",
            required: "Please a provide your password",
            password: {
                required: "Please a provide your password",
                minlength: "Password needs to be atleast 5 characters long"
            },
            confirm_password: {
                required: "Please a provide your password",
                minlength: "Password needs to be atleast 5 characters long",
                equalTo: "Passwords need to match"
            },
            email: {
                required: "Please provide a valid email address",
                email: "Please provide a valid email address"
            }
        }
    });
    $("#login_form").validate({
        rules: {
            username: "required",
            password: "required"
        },
        messages: {
            username: "Please provide your username",
            password: "Please provide your password"
        }
    });
    $("#userUpdate").validate();
    $("#campgroundNew").validate();
    $("#editCampground").validate();
}


function newsletterCheckboxChecked(e) {
    e.stopPropagation();
    $(this).fadeOut(1);
    $("#newsletterCheckboxChecked").fadeIn(1);
    $("#newsletter").prop("checked", true);
    setBinds();
}

function newsletterCheckboxUnchecked(e) {
    e.stopPropagation();
    $(this).fadeOut(1);
    $("#newsletterCheckbox").fadeIn(1);
    $("#newsletter").prop("checked", false);
    setBinds();
}