const mongoose = require('mongoose');
require('dotenv').config(); // <-- This loads the secrets from the .env file!

const connectDB = async () => {
    try {
        // Now it uses the variable instead of a hardcoded string
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`[MongoDB] Successfully connected to: ${conn.connection.host}`);
    } catch (err) {
        console.error('[MongoDB] Connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;