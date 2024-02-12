const { render } = require('ejs');
const Model = require('./models/Model');
const bcrypt = require('bcrypt');
const fs = require('fs');


const Comment = require('./models/Comment');
const { validateToken } = require('./JWT');
const {jwtDecode} = require('jwt-decode');

function doAll(app, upload) {

    app.get('/models', function(req, res) {
        Model.find()
        .then(function(models){
            res.json(models);
        })
        .catch(function(err){
            res.status(400).send(err);
        })
    });

    app.post('/api/newModel', validateToken, upload.any(), function(req, res) {
        if(req.cookies["access-token"]) {
            console.log("ceate with id: " + jwtDecode(req.cookies["access-token"]).id);
            console.log("-----------------" + req.cookies["access-token"]+"-------------");
            var nom = req.body.nom;
            var description = req.body.desc;
            var telechargement = 0;
            var note = 0;
            var conseils = req.body.conseils;
            var pictures = [];
            var files = [];
            req.files.forEach(upload => {
                if (upload.fieldname == "pictures")
                    pictures.push(upload.filename);
                else if (upload.fieldname == "files")
                    files.push(upload.filename);
            });
            var model = new Model({
                nom : nom,
                description : description,
                telechargement : telechargement,
                note : note,
                conseils : conseils,
                auteurID : jwtDecode(req.cookies["access-token"]).id,
                tags : [],
                pictures: pictures,
                files : files
            });
            console.log(model);
            model.save()
            .then( mod =>
                {res.json("saved");}
            )
            .catch(function(err) {
                res.status(500).send(err);
            });
        } else {
            res.status(401).send("not logged in");
        }
    });

    app.put('/api/editModel/:id', upload.any(), function(req, res) {
        if(req.cookies["access-token"]) {
            var fichier = [];
            var pictures = [];
            for (var i = 0; i < req.files.length; i++){
                if (req.files[i].fieldname == "pictures")
                    pictures.push(req.files[i].filename);
                else if (req.files[i].fieldname == "files")
                    fichier.push(req.files[i].filename);
            }
            var newData = {
                nom : req.body.nom,
                description : req.body.desc,
                conseils : req.body.conseils,
            };
            Model.findById(req.params.id).then(function(model) {
                console.log(typeof(fichier));
                if (!Array.isArray(fichier) || fichier.length > 0){
                    console.log('pass');
                    model.files.forEach(function(file){
                        try{
                            fs.unlinkSync('uploads/'+file);
                        }
                        catch{console.error}
                        console.log(`removed %s`, file);
                    })
                }
                if (!Array.isArray(pictures) || pictures.length > 0){
                    console.log('pictures');
                    console.log(pictures);
                    model.pictures.forEach(function(file){
                        try{
                            fs.unlinkSync('uploads/'+file);
                        }
                        catch{console.error}
                        console.log(`removed %s`, file);
                    })
                }
            })
            if (!Array.isArray(fichier) || fichier.length > 0)
                {newData.files = fichier;}
            if (!Array.isArray(pictures) || pictures.length > 0){
                newData.pictures = pictures;
            }
            Model.findById(req.params.id)
            .then(function(model) {
                if(model.auteurID == jwtDecode(req.cookies["access-token"]).id || jwtDecode(req.cookies["access-token"]).admin) {
                    Model.findByIdAndUpdate(req.params.id, {$set: newData})
                    .then(function(model) {
                        console.log('updated');
                        res.json('updated');
                    })
                    .catch(function(err) {
                        res.status(500).send(err);
                    });
                } else {
                    res.json('not the author');
                }
            })
            .catch(function(err) {
                res.status(500).send(err);
            });
        } else {
            res.json('not logged in');
        }
    });

    app.delete('/api/models/:id/delete', validateToken, function(req, res) {
        if(req.cookies["access-token"]) {
            console.log("delete with id: " + jwtDecode(req.cookies["access-token"]).id);
            var auteur = jwtDecode(req.cookies["access-token"]);
            Model.findById(req.params.id)
            .then(function(model) {
                if(model.auteurID == auteur.id || auteur.admin) {
                    model.files.forEach(function(file){
                        try{
                            fs.unlinkSync('uploads/'+file);
                        }
                        catch{console.error}
                        console.log(`removed file: %s`, file);
                    })
                    model.pictures.forEach(function(file){
                        try{
                            fs.unlinkSync('uploads/'+file);
                        }
                        catch{console.error}
                        console.log(`removed picture: %s`, file);
                    })
                    Model.findByIdAndDelete(req.params.id)
                    .then(function(model) {
                        console.log("model deleted");
                        res.json("model deleted");
                        // res.redirect('/moncompte');
                    })
                    .catch(function(err) {
                        console.log(err);
                        res.status(500).send(err);
                    });
                } else {
                    console.log("not the author");
                    // res.redirect('/');
                }
            })
            .catch(function(err) {
                console.log(err);
                res.status(500).send(err);
            });
        } else {
            console.log("not logged in");
            res.redirect('/');
        }
    });

    app.get('/model/:id', function(req, res) {
        Model.findById(req.params.id)
        .then(function(model) {
            console.log(model);
            res.json(model);
            }).catch(function(err) {
                res.status(500).send(err);
            });
        });

    app.post('/api/addComment/:id', function(req, res) {
        var name = req.body.name;
        var content = req.body.content;
        var auteurID = req.cookies["access-token"]._id;
        var modelID = req.params.id;
        var comment = new Comment({
            name : name,
            content : content,
            auteurID : auteurID,
            modelID : modelID
        });
        comment.save().then(function(comment) {
            res.redirect('/model/' + req.params.id);
        }).catch(function(err) {
        res.status(500).send(err);
        });
    });

};

exports.doAll = doAll;