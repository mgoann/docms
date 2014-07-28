var mongoose = require('mongoose');

exports.UserSchema = new mongoose.Schema({
    user_id : Number,
    user_name : String,
    user_type : String,
    isvalid : String,
    create_date : Date,
    create_user : String,
    user_role : String
});