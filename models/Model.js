const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

// Schema du model

const contactSchema = mongoose.Schema({
    nom : {type : String , required: true},
    description : {type : String , required: true},
    telechargement : {type : Number, default : 0},
    note : {type : Array}, // [{id : String, note : Number}, ...]
    conseils : {type : String},
    auteurID : {type : String},
    likes : {type : Number, default : 0},
    collections : {type : Number, default : 0},
    tags : {type : Array, default : []},
    date : {type : Date, default : Date.now},
    pictures : {type : Array , required: true},
    files : {type : Array , required: true},
});

module.exports = mongoose.model('Model', contactSchema);