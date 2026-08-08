const mongoose = require('mongoose');

let connectPromise = null;

// Cached/idempotent connect — safe to call on every request. On a persistent
// server this just connects once at boot; on serverless (Vercel) it reuses
// the same connection across warm invocations of the same instance instead
// of opening a new one per request.
async function connectDB() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'bercomCMS';

    if (!uri) {
        throw new Error('MONGODB_URI is not set in .env');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!connectPromise) {
        mongoose.connection.on('connected', () => {
            console.log(`MongoDB connected -> db "${dbName}"`);
        });
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err.message);
        });

        connectPromise = mongoose.connect(uri, { dbName }).catch((err) => {
            connectPromise = null; // allow retry on next call if this attempt failed
            throw err;
        });
    }

    await connectPromise;
    return mongoose.connection;
}

module.exports = connectDB;
