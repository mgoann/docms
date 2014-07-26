var mongoose = require('mongoose');
exports.SchoolInfoSchema = new mongoose.Schema({
    id : String,
    school_name : String,
    school_id : Number,
    school_type : String,
    year : Number,
    average_score : Number,
    max_score : Number,
    batch_name : String,
    ranking : Number,
    plan_hire_num : Number,
    apply_num : Number,
    region_name : String,
    mark_211 : {
        type: Boolean,
        default: false},
    mark_985 : {
        type: Boolean,
        default : false},
    enrolled_num : Number,
    student_class : String,
    tidang_score : Number
});