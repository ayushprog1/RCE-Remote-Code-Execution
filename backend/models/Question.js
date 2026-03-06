const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true }
});

const questionSchema = new mongoose.Schema({
    questionId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, default: "Uncategorized" },
    successfulSubmissions: { type: Number, default: 0 }, 
    
    timeLimit: { type: String, default: "2.0 Seconds" },
    memoryLimit: { type: String, default: "256 MB" },
    starterCode: { type: String, required: true },
    testCases: [testCaseSchema] 
});

module.exports = mongoose.model('Question', questionSchema);