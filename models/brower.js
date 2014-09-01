var mongoose = require('mongoose');

exports.BrowerSchema = new mongoose.Schema({
    doc_id : {type:String,ref: 'doc'},
    brower_men : String,
    brower_time : String,
    brower_mark : String,
    is_back : {type:Boolean, default:false}
});