var mongoose = require('mongoose');

exports.SequenceSchema = new mongoose.Schema({
    nextSeqNumber: { type: Number, default: 10000 }
});

exports.DocSchema = new mongoose.Schema({
    doc_id : Number,
    doc_name : String,
    doc_type : String,
    doc_tag : String,
    project_name : String,
    total_num : Number,
    store_num : Number,
    create_time : String,
    doc_location : String,
    doc_mgr : String,
});