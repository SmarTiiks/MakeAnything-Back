const User = require('./models/User');
const bcrypt = require('bcrypt');
const Model = require('./models/Model');
const {createToken, validateToken} = require('./JWT');
const {jwtDecode} = require('jwt-decode');
const multer = require('multer');
const express = require('express');
const fs = require('fs');
var session = require('express-session');
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
                    console.log(user);
                    const accessToken = createToken(user);
                    res.cookie('access-token', accessToken, {
                        maxAge: 1000 * 60 * 60 * 24, 
                        secure: false,
                        httpOnly: false
                    });
                    console.log("cookie created successfully");
                    res.json("cookie created successfully");
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

    app.get('/monCompte', validateToken, function(req, res) {
        if( jwtDecode(req.cookies["access-token"]).admin){
            Model.find().then((modeles) => {
                res.json(modeles);
            }).catch((err) => {
                res.status(404).send("Erreur lors de la recherche des modèles");
            });
        }else{
        
            Model.find({auteurID : jwtDecode(req.cookies["access-token"]).id})
            .then((modeles) =>{
                res.json(modeles);
            }).catch((err) => {
                res.status(404).send("Erreur lors de la recherche des modèles");
            });

    }});

    app.get('/logout', function(req, res) {
        res.clearCookie('access-token');
        console.log("token destroyed");
        res.json("token destroyed");
    });

    app.get('/isInCollection/:id', validateToken, function(req, res) {
        var id = req.params.id;
        var userID = jwtDecode(req.cookies["access-token"]).id;
        User.findById(userID).then((user) => {
            if (user.Collection.includes(id)){
                res.json(true);
            } else {
                res.json(false);
            }
        }).catch((err) => {
            res.status(500).send("Erreur lors de la recherche de l'utilisateur");
        });
    });

    app.get('/collection', validateToken, function(req, res) {
        console.log("collection");
        var list = [];
        var id = jwtDecode(req.cookies["access-token"]).id;
        User.findById(id).then((user) => {
            if (user.Collection.length == 0){
                res.json([]);
            }
            for (let i = 0; i < user.Collection.length; i++) {
                const element = user.Collection[i];
                Model.findById(element).then((modele) => {
                    list.push(modele);
                    if (i == user.Collection.length - 1){
                        console.log(list);
                        res.json(list);
                    }
                    }).catch((err) => {
                        res.status(500).send("Erreur lors de la recherche du modèle");
                    });
            }
        }).catch((err) => {
            res.status(500).send("Erreur lors de la recherche de l'utilisateur");
        });
    });

    app.put('/toggleCollection/:id', validateToken, function(req, res) {
        var id = jwtDecode(req.cookies["access-token"]).id;
        User.findById(id).then((user) => {
            if (user.Collection.includes(req.params.id)){
                user.Collection.splice(user.Collection.indexOf(req.params.id), 1);
                user.save().then((user) => {
                    res.json("Model removed from collection");
                }).catch((err) => {
                    res.status(500).send("Erreur lors de la suppression du modèle de la collection");
                });
            } else {
                user.Collection.push(req.params.id);
                user.save().then((user) => {
                    res.json("Model added to collection");
                }).catch((err) => {
                    res.status(500).send("Erreur lors de l'ajout du modèle à la collection");
                });
            }
            }).catch((err) => {
                res.status(500).send("Erreur lors de la recherche de l'utilisateur");
            });
    });

    app.delete('/removeFromCollection/:id', validateToken, function(req, res) {
        var id = jwtDecode(req.cookies["access-token"]).id;
        User.findById(id).then((user) => {
            if (user.Collection.includes(req.params.id)){
                user.Collection.splice(user.Collection.indexOf(req.params.id), 1);
                user.save().then((user) => {
                    res.json("Model removed from collection");
                }).catch((err) => {
                    res.status(500).send("Erreur lors de la suppression du modèle de la collection");
                });
            } else {
                res.status(404).send("Model not in collection");
            }
            }).catch((err) => {
                res.status(500).send("Erreur lors de la recherche de l'utilisateur");
            });
    });

    app.get('/getLiked', validateToken, function(req, res) {
        var id = jwtDecode(req.cookies["access-token"]).id;
        Model.find({likes : id}).then((modeles) => {
            res.json(modeles);
        }).catch((err) => {
            res.status(500).send("Erreur lors de la recherche des modèles aimés");
        });
    });
};

exports.doAll = doAll;