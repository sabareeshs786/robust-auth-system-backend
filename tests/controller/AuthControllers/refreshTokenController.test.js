require('dotenv').config();

const { handleRefreshToken } = require('../../../controller/AuthControllers/refreshTokenController');
const User = require('../../../models/User');
const createUser = async () => {
    const user = new User({userid: 1, email: process.env.TEST_EMAIL_ID, roles: {User: 2001345}, password: "Password@123",refreshToken: 'validRefreshToken', verified: true });
    return await user.save();
}

describe('handle refresh token', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    it('should handle refresh token when cookies is not present', async () => {
        const req = {};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleRefreshToken(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.status().json).toHaveBeenCalledWith({"message": "You are not authorized\nTry logging in again"});
    });

    it('should handle refresh token when cookies does not have jwt', async () => {
        const req = {cookies: {}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleRefreshToken(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.status().json).toHaveBeenCalledWith({"message": "You are not authorized\nTry logging in again"});
    });

    
});