const mongoose = require('mongoose');
require('dotenv').config();
const Question = require('./models/Question');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rce_platform')
    .then(async () => {
        console.log("[MongoDB] Connected. Checking for existing questions...");
        
        const count = await Question.countDocuments();
        
        if (count === 0) {
            console.log("[MongoDB] Database is empty. Injecting coding problems...");
            await Question.insertMany([
                {
                    questionId: "q1",
                    title: "1. Add Two Numbers",
                    description: "Given two integers, write a C++ program to compute their sum.",
                    category: "Math",
                    timeLimit: "2.0 Seconds",
                    memoryLimit: "256 MB",
                    starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    // Write your logic here\n    \n    return 0;\n}",
                    testCases: [
                        { input: "5 7", expectedOutput: "12" },
                        { input: "100 200", expectedOutput: "300" },
                        { input: "-5 5", expectedOutput: "0" }
                    ]
                },
                {
                    questionId: "q2",
                    title: "2. Print an Array",
                    description: "Write a program that reads an integer N, followed by N integers. Print the integers back, separated by spaces.",
                    category: "Arrays",
                    timeLimit: "1.5 Seconds",
                    memoryLimit: "256 MB",
                    starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Write your logic here\n    \n    return 0;\n}",
                    testCases: [
                        { input: "3\n10 20 30", expectedOutput: "10 20 30" },
                        { input: "5\n1 2 3 4 5", expectedOutput: "1 2 3 4 5" }
                    ]
                }
            ]);
            console.log("[MongoDB] 🚀 Questions successfully injected!");
        } else {
            console.log("[MongoDB] Questions already exist. No action taken.");
        }
        
        // Disconnect and close the script
        mongoose.disconnect();
        process.exit(0);
    })
    .catch(err => {
        console.error("[MongoDB] Seeding failed:", err);
        process.exit(1);
    });