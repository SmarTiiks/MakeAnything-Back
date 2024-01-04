const User = require('./models/User');
const bcrypt = require('bcrypt');
const Model = require('./models/Model');
const {createToken, validateToken} = require('./JWT');
const {jwtDecode} = require('jwt-decode');
const multer = require('multer');
const express = require('express');
const fs = require('fs');
const { log } = require('console');

function doAll(app) {
    app.use(express.static('uploads'));
    const storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function(req,file,cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    });
    const upload = multer({storage: storage});

    app.post('/inscription', upload.single('picture'), function(req, res) {
        var username = req.body.username;
        var password = bcrypt.hashSync(req.body.password, 10);
        var picture = req.file ? req.file.filename : "";
        var email = req.body.email;
        var newUser = new User({
            username : username,
            email : email,
            picture : picture,
            password : password,
        });
        newUser.save()
        .then( item => {
            console.log("Utilisateur créé");
            res.json("Utilisateur créé");
            // res.redirect('http://localhost:3000/connexion');
        }).catch(err => {
            if(picture !== ""){
            fs.unlinkSync('uploads/' + picture);
            }
            res.status(404).json("Erreur lors de la création de l'utilisateur");
        });
    });

    app.post('/connexion', function(req, res){
        User.findOne({
            username: req.body.username
        }).then(user => {
            if(user){
                if(bcrypt.compareSync(req.body.password, user.password)){
                    console.log('User found');
                    const accessToken = createToken(user);
                    res.cookie('access-token', accessToken, {
                        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
                        httpOnly: true
                    });
                    console.log("cookie created successfully");
                    res.redirect('http://localhost:3000/');
                    // res.json(accessToken);
                } else {
                    return res.status(404).json("Invalid password");
                }
            } else {
                return res.status(404).json("User not found with username " + req.body.username);
            }
        }).catch(err => {
            console.log(err);
        });
    });

    app.get('/monCompte', function(req, res) {
        if(req.session.user) {
            Model.find({auteurID : req.session.user._id})
            .then((modeles) =>{
                res.render('MonCompte', {user : req.session.user, modeles : modeles});
            }).catch((err) => {
                res.status(404).send("Erreur lors de la recherche des modèles");
            });
        } else {
            res.redirect('/');
        }
    });

    app.get('/logout', function(req, res) {
        res.clearCookie('access-token');
        console.log("token destroyed");
        res.json("token destroyed");
    });
};

exports.doAll = doAll;