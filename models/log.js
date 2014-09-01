var mongoose = require('mongoose');

exports.LogSchema = new mongoose.Schema({
    user_name : String,
    oper_name : String,
    oper_target : String,
    oper_time : String,
});