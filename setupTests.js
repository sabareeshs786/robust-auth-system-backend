// setupTests.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer, mongoUri;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create(); // Use create method to start the server
    mongoUri = mongoServer.getUri(); // Use getUri method to get the URI
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

process.env.MONGO_URI = mongoUri; // Expose the MongoDB URI for test suites to use

module.exports = async () => {
    // Additional setup code if needed
};