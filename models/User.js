const mongoose = require('mongoose');
const contactSchema = mongoose.Schema({
    username : {type : String, required : true, unique : true},
    email : {type : String, required : true, unique : true},
    password : {type : String, required : true},
    admin : {type : Boolean, default : false},
    picture: {type : String , default : "default.png"},
    Collection: {type : Array, default : []},
});

module.exports = mongoose.model('User', contactSchema);