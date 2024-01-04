const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const contactSchema = mongoose.Schema({
    name : {type : String, required : true},
    content : {type : String, required : true},
    auteurID : {type : String, required : true},
    modelID : {type : String, required : true},
    date : {type : Date, default : Date.now},
    motherID : {type : String, default : ""},
    picture : {type : String},
});

module.exports = mongoose.model('Comment', contactSchema);