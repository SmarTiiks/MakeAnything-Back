const User = require('./models/User');
const bcrypt = require('bcrypt');
const Model = require('./models/Model');
const {createToken, validateToken} = require('./JWT');
const {jwtDecode} = require('jwt-decode');
const multer = require('multer');
const express = require('express');
const fs = require('fs');
var session = require('express-session');

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
            // res.redirect(process.env.FRONTEND_URL + '/connexion');
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
                    // req.session.user = user;
                    // req.session.save();
                    res.cookie('access-token', accessToken, {
                        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
                        secure: false,
                        httpOnly: false
                        // domain: process.env.FRONTEND_URL
                    });
                    // console.log(req.session);
                    console.log("cookie created successfully");
                    // console.log(req.session.user);
                    res.redirect(process.env.FRONTEND_URL + '/');
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

    app.get('/monCompte/:id', function(req, res) {
        // if(req.cookies["access-token"]) {
            console.log("moncompte");
            Model.find({auteurID : req.params.id})
            .then((modeles) =>{
                res.json(modeles);
            }).catch((err) => {
                res.status(404).send("Erreur lors de la recherche des modèles");
            });
        // } else {
        //     // res.redirect('/');
        //     res.status(404).send("Vous n'êtes pas connecté");
        // }
    });

    app.get('/logout', function(req, res) {
        res.clearCookie('access-token');
        // req.session.destroy();
        console.log("token destroyed");
        res.json("token destroyed");
    });
};

exports.doAll = doAll;