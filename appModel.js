const { render } = require('ejs');

const Model = require('./models/Model');
const Comment = require('./models/Comment');

const bcrypt = require('bcrypt');
const fs = require('fs');


const { validateToken } = require('./JWT');
const { jwtDecode } = require('jwt-decode');
const User = require('./models/User');

function doAll(app, upload) {

    app.get('/getFile/:id', function (req, res) {
        Model.findById(req.params.id).then(function (model) {
            if (!model) return res.status(404).end();
            let filePath = './uploads/' + model.files[0];
            if (!fs.existsSync(filePath)) return res.status(404).end();
            let file = fs.readFileSync(filePath);
            res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
            res.end(file, 'binary');
        }).catch(function (err) {
            console.log("Error in getFile: %s", err);
            res.status(500).send(err);
        });
    });


    app.get('/models/:tag', function (req, res) {
        var tag = req.params.tag;
        if (tag == 'download') {
            console.log("searching for downloads");
            Model.find().sort([['telechargement', 'descending']])
                .then(function (models) {
                    res.json(models);
                })
                .catch(function (err) {
                    res.status(400).send(err);
                })
        }
        else if (tag == 'recent') {
            console.log("searching for recent models");
            Model.find().sort([['date', 'descending']])
                .then(function (models) {
                    res.json(models);
                })
                .catch(function (err) {
                    res.status(400).send(err);
                })
        }
        else {
            console.log("searching for tag: %s", tag);
            Model.find({  tags: tag })
                .then(function (models) {
                    res.json(models);
                })
                .catch(function (err) {
                    res.status(400).send(err);
                })
        }
    });

    app.post('/api/newModel', validateToken, upload.any(), function (req, res) {
        if (req.cookies["access-token"]) {
            var nom = req.body.nom;
            var description = req.body.desc;
            var telechargement = 0;
            var note = 0;
            var conseils = req.body.conseils;
            var pictures = [];
            var files = [];
            var tags = req.body.tags.split(',');
            req.files.forEach(upload => {
                if (upload.fieldname == "pictures")
                    pictures.push(upload.filename);
                else if (upload.fieldname == "files")
                    files.push(upload.filename);
            });
            var model = new Model({
                nom: nom,
                description: description,
                telechargement: telechargement,
                note: note,
                conseils: conseils,
                auteurID: jwtDecode(req.cookies["access-token"]).id,
                tags: tags,
                pictures: pictures,
                files: files
            });
            model.save()
                .then(mod => { res.json("saved"); }
                )
                .catch(function (err) {
                    res.status(500).send(err);
                });
        } else {
            res.status(401).send("not logged in");
        }
    });

    app.put('/api/editModel/:id', upload.any(), function (req, res) {
        if (req.cookies["access-token"]) {
            var fichier = [];
            var pictures = [];
            for (var i = 0; i < req.files.length; i++) {
                if (req.files[i].fieldname == "pictures")
                    pictures.push(req.files[i].filename);
                else if (req.files[i].fieldname == "files")
                    fichier.push(req.files[i].filename);
            }
            var newData = {
                nom: req.body.nom,
                description: req.body.desc,
                conseils: req.body.conseils,
                tags: req.body.tags.split(',')
            };
            Model.findById(req.params.id).then(function (model) {
                if (!Array.isArray(fichier) || fichier.length > 0) {
                    model.files.forEach(function (file) {
                        try {
                            fs.unlinkSync('uploads/' + file);
                        }
                        catch { console.error }
                        console.log(`removed %s`, file);
                    })
                }
                if (!Array.isArray(pictures) || pictures.length > 0) {
                    model.pictures.forEach(function (file) {
                        try {
                            fs.unlinkSync('uploads/' + file);
                        }
                        catch { console.error }
                        console.log(`removed %s`, file);
                    })
                }
            })
            if (!Array.isArray(fichier) || fichier.length > 0) { newData.files = fichier; }
            if (!Array.isArray(pictures) || pictures.length > 0) {
                newData.pictures = pictures;
            }
            Model.findById(req.params.id)
                .then(function (model) {
                    if (model.auteurID == jwtDecode(req.cookies["access-token"]).id || jwtDecode(req.cookies["access-token"]).admin) {
                        Model.findByIdAndUpdate(req.params.id, { $set: newData })
                            .then(function (model) {
                                console.log('updated');
                                res.json('updated');
                            })
                            .catch(function (err) {
                                res.status(500).send(err);
                            });
                    } else {
                        res.json('not the author');
                    }
                })
                .catch(function (err) {
                    res.status(500).send(err);
                });
        } else {
            res.json('not logged in');
        }
    });

    app.delete('/api/models/:id/delete', validateToken, function (req, res) {
        if (req.cookies["access-token"]) {
            var auteur = jwtDecode(req.cookies["access-token"]);
            Model.findById(req.params.id)
                .then(function (model) {
                    if (model.auteurID == auteur.id || auteur.admin) {
                        model.files.forEach(function (file) {
                            try {
                                fs.unlinkSync('uploads/' + file);
                            }
                            catch { console.error }
                            console.log(`removed file: %s`, file);
                        })
                        model.pictures.forEach(function (file) {
                            try {
                                fs.unlinkSync('uploads/' + file);
                            }
                            catch { console.error }
                            console.log(`removed picture: %s`, file);
                        })
                        Model.findByIdAndDelete(req.params.id)
                            .then(function (model) {
                                console.log("model deleted");
                                res.json("model deleted");
                            })
                            .catch(function (err) {
                                console.log(err);
                                res.status(500).send(err);
                            });
                    } else {
                        console.log("not the author");
                    }
                })
                .catch(function (err) {
                    console.log(err);
                    res.status(500).send(err);
                });
        } else {
            console.log("not logged in");
            res.redirect('/');
        }
    });

    app.put('/api/like/:id', validateToken, function (req, res) {
        var auteur = jwtDecode(req.cookies["access-token"]);
        Model.findById(req.params.id)
            .then(function (model) {
                if (model.likes.includes(auteur.id)) {
                    model.likes.splice(model.likes.indexOf(auteur.id), 1);
                    model.save()
                        .then(function () {
                            console.log('unliked');
                            res.json('unliked');
                        })
                        .catch(function (err) {
                            res.status(500).send(err);
                        });
                } else {
                    model.likes.push(auteur.id);
                    model.save()
                        .then(function () {
                            console.log('liked');
                            res.json('liked');
                        })
                        .catch(function (err) {
                            res.status(500).send(err);
                        });
                }
            })
            .catch(function (err) {
                res.status(500).send(err);
            });
    });

    app.put('/api/unlike/:id', validateToken, function (req, res) {
        var auteur = jwtDecode(req.cookies["access-token"]);
        Model.findById(req.params.id)
            .then(function (model) {
                if (model.likes.includes(auteur.id)) {
                    model.likes.splice(model.likes.indexOf(auteur.id), 1);
                    model.save()
                        .then(function () {
                            console.log('unliked');
                            res.json('unliked');
                        })
                        .catch(function (err) {
                            res.status(500).send(err);
                        });
                } else {
                    console.log('not liked');
                    res.json('not liked');
                }
            })
            .catch(function (err) {
                res.status(500).send(err);
            });
    });

    app.put('/api/download/:id', function (req, res) {
        Model.findByIdAndUpdate(req.params.id, { $inc: { telechargement: 1 } })
            .then(function (model) {
                res.json('downloaded');
            })
            .catch(function (err) {
                res.status(500).send(err);
            });
    });

    app.get('/model/:id', function (req, res) {
        Model.findById(req.params.id)
            .then(function (model) {
                res.json(model);
            }).catch(function (err) {
                res.status(500).send(err);
            });
    });

    // --------------------------------- Comments part --------------------------------- //

    app.get('/api/comment/:id', function (req, res) {
        Comment.findById(req.params.id)
            .then(function (comment) {
                res.json(comment);
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    });

    app.put('/api/modifyComment/:id', validateToken, upload.single('picture'), function (req, res) {
        console.log('modifyComment');
        var auteur = jwtDecode(req.cookies["access-token"]);
        var newData = {
            name: req.body.name,
            content: req.body.content,
            picture: (req.file && !req.deleteImg) ? req.file.filename : null
        };
        Comment.findById(req.params.id)
            .then(function (comment) {
                if (comment.auteurID == auteur.id || auteur.admin) {
                    if (req.deleteImg || req.file) {
                        try {
                            fs.unlinkSync('uploads/' + comment.picture);
                        }
                        catch { console.error }
                        console.log(`removed %s`, comment.picture);
                        if (req.deleteImg && req.file) {
                            try {
                                fs.unlinkSync('uploads/' + req.file.filename);
                            }
                            catch { console.error };
                        }
                    }
                    Comment.findByIdAndUpdate(req.params.id, { $set: newData })
                        .then(function (comment) {
                            console.log('comment updated');
                            res.json('comment updated');
                        })
                        .catch(function (e) {
                            console.log(e);
                            res.status(500).send(e);
                        });
                } else {
                    console.log('not the author');
                    res.json('not the author');
                }
            }, function (e) {
                console.log(e);
                res.status(500).send(e);
            });
    });

    app.delete('/api/deleteComment/:id', validateToken, function (req, res) {
        var auteur = jwtDecode(req.cookies["access-token"]);
        Comment.findById(req.params.id)
            .then(function (comment) {
                if (comment.auteurID == auteur.id || auteur.admin) {
                    try {
                        fs.unlinkSync('uploads/' + comment.picture);
                    }
                    catch { console.error }
                    console.log(`removed %s`, comment.picture);
                    Comment.findByIdAndDelete(req.params.id)
                        .then(function (comment) {
                            console.log('comment deleted');
                            res.json('comment deleted');
                        })
                        .catch(function (e) {
                            console.log(e);
                            res.status(500).send(e);
                        });
                } else {
                    console.log('not the author');
                    res.json('not the author');
                }
            }, function (e) {
                console.log(e);
                res.status(500).send(e);
            });
    });

    app.get('/api/comments/:modelId/:motherId', function (req, res) {
        Comment.find({ modelID: req.params.modelId, motherID: req.params.motherId == 'none' ? '' : req.params.motherId }).sort([['date', 'descending']])
            .then(function (comments) {
                res.json(comments);
            })
            .catch(function (err) {
                res.status(500).send(err);
            });
    });

    app.post('/api/addComment/:id/:motherId', validateToken, upload.single('picture'), function (req, res) {
        var auteur = jwtDecode(req.cookies["access-token"]);
        var name = req.body.name;
        var content = req.body.content;
        var auteurID = auteur.id;
        var modelID = req.params.id;
        var motherID = "";
        var picture = req.file ? req.file.filename : null;
        if (req.params.motherId != 'none') {
            motherID = req.params.motherId;
        }
        var comment = new Comment({
            name: name,
            content: content,
            auteurID: auteurID,
            auteurName: auteur.username,
            auteurPic: auteur.picture,
            modelID: modelID,
            motherID: motherID,
            picture: picture
        });
        comment.save().then(function (comment) {
            console.log('comment saved');
            res.json("comment saved");
        }).catch(function (err) {
            console.log("Add comment error");
            res.status(500).send(err);
        });
    });

};

exports.doAll = doAll;