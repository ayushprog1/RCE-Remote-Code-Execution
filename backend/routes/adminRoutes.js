const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

router.post('/', async (req, res) => {
    try {
        const newQuestion = new Question(req.body); 
        await newQuestion.save();
        res.status(201).json({ message: "Question successfully added to MongoDB!" });
    } catch (err) {
        console.error("Create Error:", err);
        res.status(400).json({ error: "Failed to add question.", details: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        await Question.findOneAndUpdate(
            { questionId: req.params.id }, 
            req.body, 
            { new: true } 
        );
        res.json({ message: "Question successfully updated!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update question." });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Question.findOneAndDelete({ questionId: req.params.id });
        res.json({ message: "Question permanently deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete question." });
    }
});

// THIS IS THE LINE THAT PREVENTS THE CRASH!
module.exports = router;