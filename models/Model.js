const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const contactSchema = mongoose.Schema({
    nom : {type : String},
    description : {type : String}, //, required : true
    telechargement : {type : Number, default : 0},
    note : {type : Array}, // [{id : String, note : Number}, ...]
    conseils : {type : String},
    auteurID : {type : String},
    likes : {type : Number, default : 0},
    collections : {type : Number, default : 0},
    tags : {type : Array},
    date : {type : Date, default : Date.now},
    pictures : {type : Array},
    files : {type : Array},
});

module.exports = mongoose.model('Model', contactSchema);