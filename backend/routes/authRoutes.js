const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- HELPER FUNCTION: GENERATE VIP WRISTBAND ---
const generateToken = (id) => {
    // This signs a token with the user's database ID and your secret key
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Wristband expires in 30 days
    });
};

// ==========================================
// 1. REGISTER A NEW USER
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if the user already exists in the database
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: "A user with this email already exists." });
        }

        // Create the user! (The password will be automatically hashed by our User.js model)
        const user = await User.create({
            username,
            email,
            password
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id) // Hand them their wristband immediately!
            });
        } else {
            res.status(400).json({ error: "Invalid user data." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during registration." });
    }
});

// ==========================================
// 2. LOGIN AN EXISTING USER
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user by their email
        const user = await User.findOne({ email });

        // 2. If the user exists AND the typed password matches the hashed database password
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                solvedQuestions: user.solvedQuestions,
                token: generateToken(user._id) // Hand them their wristband!
            });
        } else {
            res.status(401).json({ error: "Invalid email or password." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during login." });
    }
});

module.exports = router;