var mongoose = require('mongoose');
//var voteSchema = new mongoose.Schema({
//    ip : 'String'
//});
//var choiceSchema = new mongoose.Schema({
//    text : String,
//    votes : [ voteSchema ]
//});
//exports.PollSchema = new mongoose.Schema({
//    question : {
//        type : String,
//        required : true
//    },
//    choices : [ choiceSchema ]
//});

exports.UserSchema = new mongoose.Schema({
    id : String,
    user_name : String,
    user_id : Number,
    user_type : String,
    isvalid : Number,
    create_date : Date,
    create_user : String,
    user_role : String
});