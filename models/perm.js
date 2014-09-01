var mongoose = require('mongoose');

exports.PermSchema = new mongoose.Schema({
    perm_type : String,
    perm_string : String,
});