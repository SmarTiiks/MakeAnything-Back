const {sign, verify} = require('jsonwebtoken');
require('dotenv').config();


const secret = process.env.SECRET

const createToken = (user) => {
    const accessToken = sign({
        username: user.username,
        id: user._id,
        admin: user.admin
    },
    secret);
    return accessToken;
};

const validateToken = (req, res, next) => {
    const accessToken = req.cookies["access-token"];
    if(!accessToken) 
        return res.status(400).json({error: "User not authenticated"});
    try {
        const validToken = verify(accessToken, secret);
        if(validToken) {
            req.authenticated = true;
            return next();
        }
    } catch (err) {
        return res.status(400).json({error: err});
    }
};

module.exports = {createToken, validateToken};