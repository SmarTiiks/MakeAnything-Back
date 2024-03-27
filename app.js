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

// Swagger for Documentation

const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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

//------------------------------------ Routes ------------------------------------//

app.get('/getJwt', function(req, res) {
    console.log("Get JWT request");
    if(req.cookies["access-token"]){
        const decoded = jwtDecode(req.cookies["access-token"]);
        console.log(decoded);
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
    const userInput = req.body.captcha;
    if(userInput === req.session.captcha) {
        console.log("Captcha is Valid");
        res.status(200).send("Valid");
    } else {
        console.log("Captcha is Invalid");
        res.status(200).send("Invalid");
    }
});

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