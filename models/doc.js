var mongoose = require('mongoose');

exports.DocSchema = new mongoose.Schema({
    doc_id : Number,
    doc_name : String,
    doc_type : String,
    doc_tag : String,
    doc_img : {type : String, default: ''},
    doc_file : {type : String, default: ''},
    project_name : String,
    total_num : Number,
    store_num : Number,
    create_time : String,
    doc_location : String,
    doc_mgr : String,
});