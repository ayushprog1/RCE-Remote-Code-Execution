const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

router.get('/', async (req, res) => {
    try {
        const questionsFromDB = await Question.find({});
        const safeQuestions = questionsFromDB.map(q => ({
            id: q.questionId,
            title: q.title,
            description: q.description,
            category: q.category,
            successfulSubmissions: q.successfulSubmissions,
            starterCode: q.starterCode,
            timeLimit: q.timeLimit,
            memoryLimit: q.memoryLimit,
            sampleInput: q.testCases[0].input,
            sampleExpectedOutput: q.testCases[0].expectedOutput
        }));
        res.json(safeQuestions);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch questions." });
    }
});

// THIS IS THE LINE THAT PREVENTS THE CRASH!
module.exports = router;