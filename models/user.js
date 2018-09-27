var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: String,
    firstname: String,
    surname: String,
    email: { type: String, unique: true, required: true },
    avatar: Object,
    description: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    newsletterIsAccepted: { type: Boolean, default: false },
    emailIsVerified: { type: Boolean, default: false },
    liked: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campground"
        },
        name: String
    }],
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);