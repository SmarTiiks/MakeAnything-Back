const { render } = require('ejs');
const Model = require('./models/Model');
const bcrypt = require('bcrypt');

const Comment = require('./models/Comment');

function doAll(app) {

    app.get('/newModel', function(req, res) {
        if(req.session.user) {
            res.render('newModel', {user : req.session.user});
        } else {
            res.redirect('/');
        }
    });

    app.post('/api/newModel', function(req, res) {
        if(req.session.user) {
            var nom = req.body.nom;
            var description = req.body.description;
            var telechargement = 0;
            var note = 0;
            var conseils = req.body.conseils;
            var model = new Model({
                nom : nom,
                description : description,
                telechargement : telechargement,
                note : note,
                conseils : conseils,
                auteurID : req.session.user._id
            });
            console.log(model);
            model.save()
            .then(function(model) {
                res.redirect('/moncompte');
            })
            .catch(function(err) {
                res.status(500).send(err);
            });
        } else {
            res.redirect('/');
        }
    });

    app.get('/models/:id/edit', function(req, res) {
        if(req.session.user) {
            Model.findById(req.params.id)
            .then(function(model) {
                if(model.auteurID == req.session.user._id) {
                    res.render('editModel', {model : model, user : req.session.user});
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

    app.put('/api/editModel/:id', function(req, res) {
        if(req.session.user) {
            Model.findById(req.params.id)
            .then(function(model) {
                if(model.auteurID == req.session.user._id) {
                    Model.findByIdAndUpdate(req.params.id, req.body)
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

    app.delete('/api/models/:id/delete', function(req, res) {
        if(req.session.user) {
            Model.findById(req.params.id)
            .then(function(model) {
                if(model.auteurID == req.session.user._id) {
                    Model.findByIdAndDelete(req.params.id)
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

    app.get('/model/:id', function(req, res) {
        Model.findById(req.params.id)
        .then(function(model) {
            Comment.find({modelID : req.params.id}).then(function(comments) {
                res.render('Model', {model : model, user : req.session.user, comments : comments});
            }).catch(function(err) {
                res.status(500).send(err);
            });
        })
        .catch(function(err) {
            res.status(500).send(err);
        });
    });

    app.post('/api/addComment/:id', function(req, res) {
        var name = req.body.name;
        var content = req.body.content;
        var auteurID = req.session.user._id;
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