const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { getAccessToken } = require('../../utils/getTokens');

const handleRefreshToken = async (req, res) => {

    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({"message": "You are not authorized\nTry logging in again"});
    const refreshToken = cookies.jwt;

    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) return res.status(403).json({"message": "You are not authorized\nTry logging in again"});

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.userid !== decoded.userid ) 
                return res.status(403).json({"message": "You are not authorized\nTry logging in again"});
            const roles = Object.values(foundUser.roles).filter(Boolean);
            const accessToken = getAccessToken(decoded.userid, roles);
            res.json({ roles, accessToken });
        }
    );
}

module.exports = { handleRefreshToken };