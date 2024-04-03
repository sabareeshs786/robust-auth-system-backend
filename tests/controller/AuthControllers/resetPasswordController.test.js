require('dotenv').config();
const bcrypt = require('bcrypt');

const { handleResetPassword } = require('../../../controller/AuthControllers/resetPasswordController');
const User = require('../../../models/User');
const ForgotPasswordVerificationCodes = require('../../../models/FPasswordVC');
const { getRefreshToken } = require('../../../utils/getTokens');

const createUser = async () => {
    const refreshToken = getRefreshToken(1);
    const hashedPwd = await bcrypt.hash("Password@123", 10);
    const user = new User({userid: 1, email: process.env.TEST_EMAIL_ID, roles: {User: 2001345}, password: hashedPwd,refreshToken: refreshToken, verified: true });
    await user.save();
    return {user, refreshToken};
}

describe('handleResetPassword', () => {
    beforeEach(async () => {
        await User.deleteMany({});
        await ForgotPasswordVerificationCodes.deleteMany({});
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

    it('should handle reset password for existing user by verification code not verified', async () => {
        await createUser();
        const req = {body: {emailPhno, pwd, cpwd}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleResetPassword(req, res);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.status().json).toHaveBeenCalledWith({message: "Not verified"});
    });

    it('should handle reset password for existing user by verification code not verified', async () => {
        const {user, refreshToken} = await createUser();
        const fPasswordVC = new ForgotPasswordVerificationCodes({userid: user.userid, code: "123456"});
        await fPasswordVC.save();

        const req = {body: {emailPhno, pwd, cpwd}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleResetPassword(req, res);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.status().json).toHaveBeenCalledWith({message: "Not verified"});
    });

    const passwordTests = [
        {body: {emailPhno, pwd: "rrr", cpwd: "rrr"}, message: "Invalid password entered"},
        {body: {emailPhno, pwd: "Password@1234", cpwd: "Password@123"}, message: "Passwords doesn't match"}
    ];
    passwordTests.forEach(({body, message}) => {
        it('should handle reset password for existing user with invalid password', async () => {
            const {user} = await createUser();
            const fPasswordVC = new ForgotPasswordVerificationCodes({userid: user.userid, code: "123456", verified: true});
            await fPasswordVC.save();
    
            const req = {body};
            const res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            };
    
            await handleResetPassword(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({message});
        });
    });
    
    it('should handle reset password for existing user with valid password', async () => {
        const {user} = await createUser();
        const fPasswordVC = new ForgotPasswordVerificationCodes({userid: user.userid, code: "123456", verified: true});
        await fPasswordVC.save();

        const req = {body : {emailPhno, pwd, cpwd}};
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await handleResetPassword(req, res);
        const updatedUser = await User.findOne({email: user.email});
        const match = await bcrypt.compare(pwd, updatedUser.password);
        const count = await ForgotPasswordVerificationCodes.countDocuments({ userid: user.userid });
        expect(match).not.toBeNull();
        expect(match).not.toBeUndefined();
        expect(count).toBe(0);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.status().json).toHaveBeenCalledWith({message: "Password changed successfully"});
    });
    
});