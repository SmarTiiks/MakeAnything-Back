const { render } = require('ejs');
const Model = require('./models/Model');
const bcrypt = require('bcrypt');

const Comment = require('./models/Comment');
const { validateToken } = require('./JWT');
const {jwtDecode} = require('jwt-decode');

function doAll(app, upload) {

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

    app.get('/models/:id/edit', function(req, res) {
        if(req.cookies["access-token"]) {
            Model.findById(req.params.id)
            .then(function(model) {
                if(model.auteurID == req.cookies["access-token"]._id) {
                    res.render('editModel', {model : model, user : req.cookies["access-token"]});
                } else {
                    res.redirect('/');
                }
            })
            .catch(function(err) {
                res.status(500).send(err);
            });
        } else {
            res.redirect('/');
        }
    });

    app.put('/api/editModel/:id', upload.any(), function(req, res) {
        if(req.cookies["access-token"]) {
            var files = [];
            var pictures = [];
            for (var i = 0; i < req.files.length; i++){
                if (req.files[i].fieldname == "pictures")
                    pictures.push(req.files[i].filename);
                else if (req.files[i].fieldname == "files")
                    files.push(req.files[i].filename);
            }
            var newData = {
                nom : req.body.nom,
                description : req.body.desc,
                conseils : req.body.conseils,
            };
            if (files != [])
                {newData.files = files;}
            if (pictures != []){
                newData.pictures = pictures;
            }
            Model.findById(req.params.id)
            .then(function(model) {
                if(model.auteurID == req.cookies["access-token"]._id) {
                    Model.findByIdAndUpdate(req.params.id, {$set: newData})
                    .then(function(model) {
                        res.redirect('/moncompte');
                    })
                    .catch(function(err) {
                        res.status(500).send(err);
                    });
                } else {
                    res.redirect('/');
                }
            })
            .catch(function(err) {
                res.status(500).send(err);
            });
        } else {
            res.redirect('/');
        }
    });

    app.delete('/api/models/:id/delete', validateToken, function(req, res) {
        if(req.cookies["access-token"]) {
            console.log("delete with id: " + jwtDecode(req.cookies["access-token"]).id);
            var auteur = jwtDecode(req.cookies["access-token"]).id;
            Model.findById(req.params.id)
            .then(function(model) {
                if(model.auteurID == auteur) {
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