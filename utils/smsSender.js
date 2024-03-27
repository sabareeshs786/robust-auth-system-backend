require('dotenv').config();
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { errorLogger } = require('../middleware/errorHandler');
const { successLog } = require('../middleware/logEvents');

const sendSms = async (phno, mes) => {
    try {
        // Define parameters for the SMS message
        const params = {
            Message: mes,
            PhoneNumber: phno,
            MessageAttributes: {
                'AWS.SNS.SMS.SenderID': {
                    'DataType': 'String',
                    'StringValue': 'String'
                }
            }
        };

        // Create an SNS client with the specified configuration
        const sns = new SNSClient({
            region: process.env.AWS_REGION, // AWS region from environment variables
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY, // AWS access key from environment variables
                secretAccessKey: process.env.AWS_SECRET_KEY // AWS secret key from environment variables
            }
        });

        // Send the SMS message using the defined SNS client and parameters
        const command = new PublishCommand(params);
    
        // Send the SMS message using the SNS client and the created command
        const message = await sns.send(command);
        successLog("Message sent:", message);
        return true;
    } catch (err) {
        errorLogger("Error sending the message " + err);
        return false;
    }
}

module.exports = { sendSms };