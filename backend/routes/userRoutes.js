const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Question = require('../models/Question');

// GET: Fetch user profile and populated solved questions
router.get('/:id/profile', async (req, res) => {
    try {
        // 1. Find the user, but exclude the password field for security!
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 2. Look up all the actual question data for the IDs the user solved
        const solvedQuestionsData = await Question.find({
            questionId: { $in: user.solvedQuestions }
        });

        // 3. Send it all back as a clean package
        res.json({
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
                joinedAt: user.createdAt
            },
            totalSolved: user.solvedQuestions.length,
            solvedDetails: solvedQuestionsData
        });

    } catch (err) {
        console.error("Profile Fetch Error:", err);
        res.status(500).json({ error: "Server error fetching profile" });
    }
});

module.exports = router;