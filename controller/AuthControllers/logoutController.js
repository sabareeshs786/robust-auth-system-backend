const { errorLogger } = require('../../middleware/errorHandler');
const User = require('../../models/User');
const { res500 } = require('../../utils/errorResponse');
const { res204 } = require('../../utils/genericResponse');

const handleLogout = async (req, res) => {

    try {
        const cookies = req.cookies;
        if (!cookies?.jwt) return res204(res);
        const refreshToken = cookies.jwt;
        
        const foundUser = await User.findOne({ refreshToken }).exec();
        if (!foundUser) {
            res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
            res.json({ accessToken: '' });
            return res.status(204);
        }

        foundUser.refreshToken = '';
        const result = await foundUser.save();
        if (!result) return res500(res);
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        res.json({ accessToken: '' });
        return res.status(204);
    }
    catch (err) {
        errorLogger(err);
        res500(res);
    }

}

module.exports = { handleLogout };