const User = require('../../models/User');
const bcrypt = require('bcrypt');
const { getAccessToken, getRefreshToken } = require('../../utils/getTokens');
const { res500 } = require('../../utils/errorResponse');

const handleLogin = async (req, res) => {
    try {
        const { emailPhno, pwd } = req.body;
        if (!emailPhno || !pwd) return res.sendStatus(400);

        const field = getField(emailPhno);
        if(!field) return res.status(400).json({message: "Invalid input data"});

        const foundUser = await User.findOne({ [field]: emailPhno }).exec();
        if (!foundUser) return res.sendStatus(401);

        const match = await bcrypt.compare(pwd, foundUser.password);
        if (!match) return res.sendStatus(401);
        if(!foundUser.verified) return res.status(401).json({message: "Email id is not verified"});

        const roles = Object.values(foundUser.roles).filter(Boolean);

        const accessToken = getAccessToken(foundUser.userid, roles);

        const refreshToken = getRefreshToken(foundUser.userid);
        foundUser.refreshToken = refreshToken;
        const result = await foundUser.save();
        if (!result) return res500(res);

        res.cookie('jwt', refreshToken, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ roles, accessToken });
    }
    catch (err) {
        return res500(res);
    }

}

module.exports = { handleLogin };