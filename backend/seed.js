const mongoose = require('mongoose');
require('dotenv').config();
const Question = require('./models/Question');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rce_platform')
    .then(async () => {
        console.log("[MongoDB] Connected. Refreshing database with empty starters...");
        
        await Question.deleteMany({}); 

        const questions = [
            {
                questionId: "q1",
                title: "1. Add Two Numbers",
                description: "Given two integers, write a C++ program to compute their sum.",
                category: "Math",
                timeLimit: "2.0 Seconds",
                memoryLimit: "256 MB",
                starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    // Your logic here\n    return 0;\n}",
                testCases: [
                    { input: "5 7", expectedOutput: "12" },
                    { input: "-5 5", expectedOutput: "0" }
                ]
            },
            {
                questionId: "q2",
                title: "2. Reverse a String",
                description: "Read a string and print its reverse.",
                category: "Strings",
                timeLimit: "1.0 Seconds",
                memoryLimit: "256 MB",
                starterCode: "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    // Your logic here\n    return 0;\n}",
                testCases: [
                    { input: "hello", expectedOutput: "olleh" },
                    { input: "NIT", expectedOutput: "TIN" }
                ]
            },
            {
                questionId: "q3",
                title: "3. Find Maximum in Array",
                description: "Read N integers and find the maximum value.",
                category: "Arrays",
                timeLimit: "1.0 Seconds",
                memoryLimit: "256 MB",
                starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Your logic here\n    return 0;\n}",
                testCases: [
                    { input: "3\n10 50 20", expectedOutput: "50" },
                    { input: "4\n-1 -5 -2 -3", expectedOutput: "-1" }
                ]
            },
            {
                questionId: "q4",
                title: "4. Factorial of a Number",
                description: "Compute the factorial of a given integer N.",
                category: "Math",
                timeLimit: "1.0 Seconds",
                memoryLimit: "256 MB",
                starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Your logic here\n    return 0;\n}",
                testCases: [
                    { input: "5", expectedOutput: "120" },
                    { input: "0", expectedOutput: "1" }
                ]
            },
            {
                questionId: "q5",
                title: "5. Palindrome Check",
                description: "Check if a string is a palindrome. Print 'Yes' or 'No'.",
                category: "Strings",
                timeLimit: "1.0 Seconds",
                memoryLimit: "256 MB",
                starterCode: "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    // Your logic here\n    return 0;\n}",
                testCases: [
                    { input: "radar", expectedOutput: "Yes" },
                    { input: "hello", expectedOutput: "No" }
                ]
            },
            {
                questionId: "q6",
                title: "6. Even or Odd",
                description: "Print 'Even' if the number is even, else print 'Odd'.",
                category: "Basic",
                timeLimit: "0.5 Seconds",
                memoryLimit: "128 MB",
                starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Your logic here\n    return 0;\n}",
                testCases: [
                    { input: "42", expectedOutput: "Even" },
                    { input: "7", expectedOutput: "Odd" }
                ]
            },
            {
                questionId: "q7",
                title: "7. Fibonacci Series",
                description: "Print the N-th Fibonacci number (0-indexed, where 0th is 0, 1st is 1).",
                category: "Math",
                timeLimit: "1.0 Seconds",
                memoryLimit: "256 MB",
                starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Your logic here\n    return 0;\n}",
                testCases: [
                    { input: "6", expectedOutput: "8" },
                    { input: "10", expectedOutput: "55" }
                ]
            },
            {
                questionId: "q8",
                title: "8. Count Vowels",
                description: "Count the number of vowels (a, e, i, o, u) in a string.",
                category: "Strings",
                timeLimit: "1.0 Seconds",
                memoryLimit: "256 MB",
                starterCode: "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    // Your logic here\n    return 0;\n}",
                testCases: [
                    { input: "education", expectedOutput: "5" },
                    { input: "rhythm", expectedOutput: "0" }
                ]
            },
            {
                questionId: "q9",
                title: "9. Sum of Digits",
                description: "Given a number, return the sum of its digits.",
                category: "Math",
                timeLimit: "1.0 Seconds",
                memoryLimit: "256 MB",
                starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Your logic here\n    return 0;\n}",
                testCases: [
                    { input: "123", expectedOutput: "6" },
                    { input: "999", expectedOutput: "27" }
                ]
            },
            {
                questionId: "q10",
                title: "10. Check Prime Number",
                description: "Print 'Prime' if a number is prime, else print 'Not Prime'.",
                category: "Math",
                timeLimit: "2.0 Seconds",
                memoryLimit: "256 MB",
                starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Your logic here\n    return 0;\n}",
                testCases: [
                    { input: "7", expectedOutput: "Prime" },
                    { input: "10", expectedOutput: "Not Prime" }
                ]
            }
        ];

        await Question.insertMany(questions);
        console.log("[MongoDB] 🚀 10 Questions successfully injected with empty starters!");
        mongoose.disconnect();
        process.exit(0);
    })
    .catch(err => {
        console.error("[MongoDB] Seeding failed:", err);
        process.exit(1);
    });