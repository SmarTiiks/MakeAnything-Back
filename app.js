var express = require('express');
var app = express();
var path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');
const cors = require('cors');

// Sécurité
    // TooBusy
    const toobusy = require('toobusy-js');
    app.use(function(req, res, next) {
        if (toobusy()) {
            res.send(503, "Server too busy. Please try again later.");
        } else {
            next();
        }
    });

    // SVG Captcha
    const session = require('express-session');
    const svgCaptcha = require('svg-captcha');
    app.use(session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true
    }));

    // hpp
    const hpp = require('hpp');
    app.use(hpp());

    // Helmet
    const helmet = require('helmet');
    app.use(helmet({crossOriginResourcePolicy: { policy: "cross-origin" }}));


// No Cache
const nocache = require('nocache');
app.use(nocache());


// Multer
const multer = require('multer');
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

// method put et delete pour express
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(cors({credentials: true, origin: process.env.FRONTEND_URL}));

// cookie parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// JWT
const {createToken, validateToken} = require('./JWT');

// JWT-decode
const {jwtDecode} = require('jwt-decode');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// connexion mongodb
var mongoose = require('mongoose');
const url = process.env.DATABASE_URL

mongoose.connect(url)
.then(console.log("MongoDB connected"))
.catch(err => console.log(err));

app.set('view engine', 'ejs');

// Models:




// app.get('/', function(req, res) {
//     Contact.find().then(dataset => {
//         res.json(dataset);
//     }).catch(err => {
//         console.log(err);
//     });
// });



app.get('/getJwt', /*validateToken,*/ function(req, res) {
    // console.log(req.session);
    // console.log(req.session.user);
    if(req.cookies["access-token"]){
        const decoded = jwtDecode(req.cookies["access-token"]);
        // const decoded = req.session.user;
        // console.log(decoded);
        res.json(decoded);
    }
    else{
        res.json(null);
    }
});

app.get('/captcha', function(req, res) {
    const captcha = svgCaptcha.create({noise: 8, size: 6, ignoreChars: '0o1iLIO'});
    req.session.captcha = captcha.text;
    console.log("Captcha generated: " + req.session.captcha);
    res.type('svg');
    res.status(200).send(captcha.data);
});

app.post('/verify', function(req, res) {
    // console.log(req.body);
    const userInput = req.body.captcha;
    // console.log(userInput, req.session);
    if(userInput === req.session.captcha) {
        console.log("Captcha is Valid");
        res.status(200).send("Valid");
    } else {
        console.log("Captcha is Invalid");
        res.status(200).send("Invalid");
    }
});

//     app.put("/editpost/:id", function(req, res) {
//         const Data = {
//             sujet : req.body.sujet,
//             sous_titre : req.body.sous_titre,
//             auteur : req.body.auteur,
//             description: req.body.description
//         };
//         Post.updateOne({_id: req.params.id}, {$set: Data})
//         .then(dataset => {
//             console.log("post updated to database");
//             res.redirect(process.env.FRONTEND_URL + '/blogs');
//         }).catch(err => {
//             console.log(err);
//         });
//     });
    
//     app.delete("/delete/:id", function(req, res) {
//         Contact.deleteOne({_id: req.params.id})
//         .then(dataset => {
//             console.log("item deleted from database");
//             res.redirect('/');
//         }).catch(err => {
//             console.log(err);
//         });
//     });

// user related code
const appUser = require('./appUser');
appUser.doAll(app);

// model related code
const appModel = require('./appModel');
appModel.doAll(app, upload);

// app.all('*', function(req, res) {
//     res.redirect("/");
//   });

var server = app.listen(5000, function(req, res) {
    console.log('Listening on %s on port %d', server.address.address, server.address().port);
});