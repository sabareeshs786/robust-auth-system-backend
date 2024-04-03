require('dotenv').config();

const { handleForgotPassword } = require('../../../controller/AuthControllers/forgotPasswordController');
const User = require('../../../models/User');
const ForgotPasswordVerificationCodes = require('../../../models/FPasswordVC');
const { getRefreshToken } = require('../../../utils/getTokens');

const createUser = async () => {
    const refreshToken = getRefreshToken(1);
    const user = new User({userid: 1, email: process.env.TEST_EMAIL_ID, roles: {User: 2001345}, password: "Password@123",refreshToken: refreshToken, verified: true });
    await user.save();
    return {user, refreshToken};
}

describe('handleForgotPassword', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    it('should handle forgot password when email id or phone number is not given', async () => {
        const req = {body: {}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleForgotPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.status().json).toHaveBeenCalledWith({message: "Invalid input data"});
    });

    it('should handle forgot password when email id or phone number is null', async () => {
        const req = {body: {emailPhno: null}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleForgotPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.status().json).toHaveBeenCalledWith({message: "Invalid input data"});
    });

    it('should handle forgot password when email id or phone number is invalid', async () => {
        const req = {body: {emailPhno: "invalid email-id phone no."}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleForgotPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.status().json).toHaveBeenCalledWith({message: "Invalid input data"});
    });

    it('should handle forgot password for non-existing user', async () => {
        const req = {body: {emailPhno: process.env.TEST_EMAIL_ID}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleForgotPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.status().json).toHaveBeenCalledWith({message: "User not found"});
    });

    it('should handle forgot password for existing user', async () => {
        const {user, refreshToken} = await createUser();
        const req = {body: {emailPhno: process.env.TEST_EMAIL_ID}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleForgotPassword(req, res);
        const count = await ForgotPasswordVerificationCodes.countDocuments({ userid: user.userid });
        
        expect(count).toBe(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.status().json).toHaveBeenCalledWith({message: "Verification code is sent to your email address"});
    });

});