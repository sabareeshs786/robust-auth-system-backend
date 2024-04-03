require('dotenv').config();

const { handleResetPassword } = require('../../../controller/AuthControllers/resetPasswordController');
const User = require('../../../models/User');
const ForgotPasswordVerificationCodes = require('../../../models/FPasswordVC');
const { getRefreshToken } = require('../../../utils/getTokens');

const createUser = async () => {
    const refreshToken = getRefreshToken(1);
    const user = new User({userid: 1, email: process.env.TEST_EMAIL_ID, roles: {User: 2001345}, password: "Password@123",refreshToken: refreshToken, verified: true });
    await user.save();
    return {user, refreshToken};
}

describe('handleResetPassword', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    it('should handle reset password when nothing is not given', async () => {
        const req = {body: {}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleResetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.status().json).toHaveBeenCalledWith({message: "Invalid input data"});
    });
    const emailPhno = process.env.TEST_EMAIL_ID;
    const pwd = "Password@123#";
    const cpwd = "Password@123#";
    const testCases = [
        {emailPhno}, {pwd}, {cpwd},
        {emailPhno, pwd }, {emailPhno, cpwd}, {pwd, cpwd},
        {emailPhno: null, pwd, cpwd}, {emailPhno, pwd: null, cpwd}, {emailPhno, pwd, cpwd: null},
        {emailPhno:null, pwd: null, cpwd}, {emailPhno: null, pwd, cpwd: null}, {emailPhno, pwd: null, cpwd: null},
        {emailPhno: "invalid email-id ph.no.", pwd, cpwd}
    ];
    testCases.forEach((body) => {
        it("should handle reset password when given data is invalid or insufficient", async () => {
            const req = {body};
            const res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            };

            await handleResetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({message: "Invalid input data"});
        });
    });

    it('should handle reset password for non-existing user', async () => {
        const req = {body: {emailPhno, pwd, cpwd}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleResetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.status().json).toHaveBeenCalledWith({message: "User not found"});
    });

    // it('should handle reset password for existing user', async () => {
    //     const {user, refreshToken} = await createUser();
    //     const req = {body: {emailPhno: process.env.TEST_EMAIL_ID}};
    //     const res = {
    //         json: jest.fn(),
    //         status: jest.fn().mockReturnThis(),
    //     };

    //     await handleResetPassword(req, res);
    //     const count = await ForgotPasswordVerificationCodes.countDocuments({ userid: user.userid });
        
    //     expect(count).toBe(1);
    //     expect(res.status).toHaveBeenCalledWith(200);
    //     expect(res.status().json).toHaveBeenCalledWith({message: "Verification code is sent to your email address"});
    // });

});