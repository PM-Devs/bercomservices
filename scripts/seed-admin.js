require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this script.');
        process.exit(1);
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        console.log(`Admin user already exists: ${email}`);
        process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ email: email.toLowerCase(), passwordHash, role: 'admin' });

    console.log(`Admin user created: ${email}`);
    process.exit(0);
}

run().catch((err) => {
    console.error('Failed to seed admin user:', err);
    process.exit(1);
});
