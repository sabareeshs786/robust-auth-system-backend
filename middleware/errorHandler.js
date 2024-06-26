const { logEvents } = require('./logEvents');

const errorHandler = (err, req, res, next) => {
    logEvents(`${err.name}: ${err.message}`, 'errLog.txt');
    console.error(err.stack);
    res.status(500).json({message: "Internal server error"});
}

const errorLogger = (err) => {
    logEvents(`${err.name}: ${err.message}`, 'errLog.txt');
    console.error(err);
}

module.exports = {errorHandler, errorLogger};