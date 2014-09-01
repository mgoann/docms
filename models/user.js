var mongoose = require('mongoose');

exports.UserSchema = new mongoose.Schema({
    user_id : Number,
    user_name : String,
    user_role : String,
    password : String
});