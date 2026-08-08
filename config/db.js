const mongoose = require('mongoose');

async function connectDB() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'bercomCMS';

    if (!uri) {
        throw new Error('MONGODB_URI is not set in .env');
    }

    mongoose.connection.on('connected', () => {
        console.log(`MongoDB connected -> db "${dbName}"`);
    });
    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err.message);
    });

    await mongoose.connect(uri, { dbName });
    return mongoose.connection;
}

module.exports = connectDB;
