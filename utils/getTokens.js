require('dotenv').config();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const getRefreshToken = (userid) => {
    const refreshToken = jwt.sign(
        { "userid": userid },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
    );
    return refreshToken;
};

const getAccessToken = (userid, roles) => {
    return jwt.sign(
        {
            "UserInfo": {
                "userid": userid,
                "roles": roles
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '2h' }
    );
}

module.exports = {getRefreshToken, getAccessToken};