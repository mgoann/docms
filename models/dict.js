var mongoose = require('mongoose');
exports.DictSchema = new mongoose.Schema({
    dict_type : String,
    dict_value : String
});