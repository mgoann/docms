var mongoose = require('mongoose');

exports.SequenceSchema = new mongoose.Schema({
    seq_name: String,
    seq: { type: Number, default: 10000 }
});