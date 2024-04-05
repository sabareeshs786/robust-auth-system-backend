require('dotenv').config();
const bcrypt = require('bcrypt');

const { handleVerification, handleForgotPasswordCode, handleResendVC } = require('../../../controller/AuthControllers/verifyController');
const User = require('../../../models/User');
const VerificationCodes = require('../../../models/VerificationCodes');
const Profile = require('../../../models/Profile');
const { getRefreshToken } = require('../../../utils/getTokens');

const createUser = async (verified = true) => {
    const refreshToken = getRefreshToken(1);
    const hashedPwd = await bcrypt.hash("Password@123", 10);
    const user = new User({userid: 1, email: process.env.TEST_EMAIL_ID, roles: {User: 2001345}, password: hashedPwd,refreshToken: refreshToken, verified: verified });
    await user.save();
    return {user, refreshToken};
}

describe('handleVerification', () => {
    beforeEach(async () => {
        await User.deleteMany({});
        await VerificationCodes.deleteMany({});
        await Profile.deleteMany({});
    });

    it('should handle verification when nothing is not given', async () => {
        const req = {body: {}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleVerification(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.status().json).toHaveBeenCalledWith({message: "Invalid input data"});
    });

    const emailPhno = process.env.TEST_EMAIL_ID;
    const code = "123456";
    const testCases = [
        {emailPhno}, {code},
        {emailPhno: null, code}, {emailPhno, code: null},
        {emailPhno: "invalid email-id phone no.", code}
    ];

    testCases.forEach((body) => {
        it("should handle verification when given data is invalid or insufficient", async () => {
            const req = {body};
            const res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            };

            await handleVerification(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({message: "Invalid input data"});
        });
    });

    it('should handle verification for non-existing user', async () => {
        const req = {body: {emailPhno, code}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleVerification(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.status().json).toHaveBeenCalledWith({message: "User not found"});
    });

    it('should handle verification for existing but verified', async () => {
        await createUser();

        const req = {body: {emailPhno, code}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleVerification(req, res);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.status().json).toHaveBeenCalledWith({message: "Email already verified"});
    });

    it('should handle verification for non-existing verification code', async () => {
        await createUser(false);

        const req = {body: {emailPhno, code}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        await handleVerification(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.status().json).toHaveBeenCalledWith({message: "Verification code expired"});
    });

    it('should handle verification when code is incorrect', async () => {
        const {user} = await createUser(false);
        const vc =  new VerificationCodes({userid: user.userid, code: "123456"});
        await vc.save();

        const req = {body: {emailPhno, code: "123455"}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        await handleVerification(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.status().json).toHaveBeenCalledWith({message: "Invalid verification code entered"});
    });

    it('should handle verification when code is correct', async () => {
        const {user} = await createUser(false);
        const vc =  new VerificationCodes({userid: user.userid, code: "123456"});
        await vc.save();

        const req = {body: {emailPhno, code}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        await handleVerification(req, res);
        
        const updatedUser = await User.findOne({email: emailPhno});
        const profileCount = await Profile.countDocuments({userid: updatedUser.userid});
        const countVc = await VerificationCodes.countDocuments({userid: updatedUser.userid});

        expect(updatedUser.verified).toBeTruthy();
        expect(profileCount).toBe(1);
        expect(countVc).toBe(0);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.status().json).toHaveBeenCalledWith({message: "Email id verified successfully"});
    });

});