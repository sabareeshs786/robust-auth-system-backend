require('dotenv').config();

const { handleLogout } = require('../../../controller/AuthControllers/logoutController');
const User = require('../../../models/User');
const createUser = async () => {
    const user = new User({userid: 1, email: process.env.TEST_EMAIL_ID, roles: {User: 2001345}, password: "Password@123",refreshToken: 'validRefreshToken', verified: true });
    return await user.save();
}

describe('handleLogout', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    it('should handle logout when cookies is not present', async () => {
        const req = {};
        const res = {
            json: jest.fn(),
            clearCookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleLogout(req, res);

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.status().json).toHaveBeenCalledWith({"message": "You are already logged out"});
    });

    it('should handle logout when cookies does not have jwt', async () => {
        const req = {cookies: {}};
        const res = {
            json: jest.fn(),
            clearCookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleLogout(req, res);

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.status().json).toHaveBeenCalledWith({"message": "You are already logged out"});
    });

    it('should handle logout for existing user', async () => {

        const user = await createUser();
        const req = { cookies: { jwt: 'validRefreshToken' } };
        const res = {
            json: jest.fn(),
            clearCookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleLogout(req, res);

        const updatedUser = await User.findOne({email: process.env.TEST_EMAIL_ID});

        expect(updatedUser.refreshToken).toBe('');
        expect(res.json).toHaveBeenCalledWith({ accessToken: '' });
        expect(res.clearCookie).toHaveBeenCalledWith('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.status().json).toHaveBeenCalledWith({ "message": "You are logged out successfully" });
    });

    it('should handle logout for non-existing user', async () => {
        const req = { cookies: { jwt: 'nonExistingToken' } };
        const res = {
            json: jest.fn(),
            clearCookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleLogout(req, res);

        expect(res.json).toHaveBeenCalledWith({ accessToken: '' });
        expect(res.clearCookie).toHaveBeenCalledWith('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.status().json).toHaveBeenCalledWith({ "message": "You are logged out successfully!!!" });
    });

    it('should handle logout when error occurs', async () => {
        const req = { cookies: { jwt: 'validToken' } };
        const res = {
            json: jest.fn(),
            clearCookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        // Mocking an error during user search
        User.findOne = null;
        await handleLogout(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

});
