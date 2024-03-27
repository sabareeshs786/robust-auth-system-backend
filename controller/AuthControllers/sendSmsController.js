const { errorLogger } = require("../../middleware/errorHandler");
const { sendSms } = require("../../utils/smsSender");

const handleSendSms = async (req, res) => {
    try {
        const phno = req.body?.phno;
    const message = `Your verification code ---->: ${Math.random().toString().substring(2, 8)}. Please don't share`;
    const result = await sendSms(phno, message);
    if(result)
        return res.status(200).json({message: "Message sent"});
    return res.status(400).json({message: "Message not sent"});
    } catch (error) {
        errorLogger(error);
        return res.sendStatus(500);
    }
}

module.exports = { handleSendSms };
