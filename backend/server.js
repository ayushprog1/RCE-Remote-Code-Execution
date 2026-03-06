const { exec } = require('child_process');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const net = require('net');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/db');
const Question = require('./models/Question');

const questionRoutes = require('./routes/questionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');


const app = express();
app.use(cors());
app.use(express.json()); // Essential for reading POST data

// Connect to MongoDB
connectDB();

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const SOCKET_PATH = '/tmp/rce_engine.sock';
const SUBMISSION_DIR = path.join(__dirname, 'submissions');

// --- MOUNT THE ROUTERS ---
// This tells Express: "If a request starts with /api/questions, send it to questionRoutes.js!"
app.use('/api/questions', questionRoutes);
app.use('/api/admin/questions', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// --- WEBSOCKET GRADING ENGINE ---
io.on('connection', (socket) => {
    console.log(`[Socket.io] User connected: ${socket.id}`);

    /*socket.on('submit_code', async (payload) => {
        const question = await Question.findOne({ questionId: payload.questionId });
        if (!question) return;

        const filePath = path.join(SUBMISSION_DIR, 'solution.cpp');
        fs.writeFileSync(filePath, payload.code);

        // STAGE 1: PLAYGROUND RUN
        fs.writeFileSync(path.join(SUBMISSION_DIR, 'input.txt'), payload.customInput || "");
        let customOutput = "";
        let compileError = false;

        try {
            const rawResponse = await new Promise((resolve, reject) => {
                const client = net.createConnection({ path: SOCKET_PATH }, () => client.write(filePath));
                client.on('data', data => { resolve(data.toString()); client.end(); });
                client.on('error', err => reject(err));
            });

            if (rawResponse.includes("EXCEEDED") || rawResponse.includes("ERROR")) {
                customOutput = rawResponse.split('\n')[0]; 
                compileError = true;
            } else {
                const outputSplit = rawResponse.split("OUTPUT:\n");
                customOutput = outputSplit.length > 1 ? outputSplit[1].trim() : "No Output.";
            }
        } catch (err) {
            customOutput = "Daemon connection failed.";
            compileError = true;
        }

        // STAGE 2: HIDDEN GRADING LOOP
        let finalVerdict = "Waiting...";
        
        if (compileError) {
            finalVerdict = "Compilation or Runtime Error";
        } else {
            let allPassed = true;
            for (let i = 0; i < question.testCases.length; i++) {
                const tc = question.testCases[i];
                fs.writeFileSync(path.join(SUBMISSION_DIR, 'input.txt'), tc.input);
                
                try {
                    const rawResponse = await new Promise((resolve) => {
                        const client = net.createConnection({ path: SOCKET_PATH }, () => client.write(filePath));
                        client.on('data', data => { resolve(data.toString()); client.end(); });
                    });
                    const outputSplit = rawResponse.split("OUTPUT:\n");
                    const actualOutput = outputSplit.length > 1 ? outputSplit[1].trim() : "";
                    
                    if (actualOutput !== tc.expectedOutput.trim()) {
                        allPassed = false;
                        break; 
                    }
                } catch (e) {
                    allPassed = false;
                    break;
                }
            }
            finalVerdict = allPassed ? "Accepted" : "Wrong Answer";
        }

        // INCREMENT SUCCESS COUNTER IN MONGODB
        if (finalVerdict === "Accepted") {
            await Question.findOneAndUpdate(
                { questionId: payload.questionId },
                { $inc: { successfulSubmissions: 1 } } 
            );
            if (payload.userId) {
                const User = require('./models/User'); // Grab the User model
                await User.findByIdAndUpdate(
                    payload.userId,
                    { $addToSet: { solvedQuestions: payload.questionId } } // $addToSet prevents duplicates!
                );
            }
        }

        socket.emit('execution_result', { status: "COMPLETED", output: customOutput, verdict: finalVerdict });
    });*/
    socket.on("submit_code", async (payload) => {
        try {
            // 1. Fetch the question from the database to get the expected output
            const question = await Question.findOne({ questionId: payload.questionId });
            if (!question) {
                return socket.emit('execution_result', { verdict: 'Error: Question not found', output: '' });
            }

            // 2. Create unique file names (so if 2 users submit at once, they don't overwrite each other)
            const uniqueId = Date.now();
            const cppFile = `temp_${uniqueId}.cpp`;
            const exeFile = `./a_${uniqueId}.out`;
            const inputFile = `input_${uniqueId}.txt`;

            // 3. Write the user's C++ code and custom input to temporary files
            fs.writeFileSync(cppFile, payload.code);
            fs.writeFileSync(inputFile, payload.customInput || '');

            // 4. The Terminal Commands to Compile and Run
            const compileCmd = `g++ ${cppFile} -o ${exeFile}`;
            const runCmd = `${exeFile} < ${inputFile}`;

            // 5. Execute! (We add a 5-second timeout so infinite loops don't crash your server)
            exec(`${compileCmd} && ${runCmd}`, { timeout: 5000 }, async (error, stdout, stderr) => {
                
                // CLEANUP: Immediately delete the temporary files so your server doesn't get cluttered
                try {
                    if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile);
                    if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile);
                    if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
                } catch (cleanupErr) { console.error("Cleanup error:", cleanupErr); }

                let finalVerdict = "Wrong Answer";
                let customOutput = stdout ? stdout.trim() : "";

                // 6. Grade the Output
                if (error) {
                    if (error.killed) {
                        finalVerdict = "Time Limit Exceeded";
                        customOutput = "Your code took too long to execute. Infinite loop?";
                    } else {
                        finalVerdict = "Compilation Error";
                        customOutput = stderr || error.message;
                    }
                } else {
                    // It ran successfully! Let's check if the output matches the expected output
                    if (customOutput === question.sampleExpectedOutput.trim()) {
                        finalVerdict = "Accepted";
                        
                        // Increment successful submissions in Question DB
                        await Question.findOneAndUpdate(
                            { questionId: payload.questionId },
                            { $inc: { successfulSubmissions: 1 } } 
                        );

                        // Record the win for the User DB
                        if (payload.userId) {
                            const User = require('./models/User');
                            await User.findByIdAndUpdate(
                                payload.userId,
                                { $addToSet: { solvedQuestions: payload.questionId } }
                            );
                        }
                    }
                }

                // 7. Send the final grade back to the React frontend!
                socket.emit('execution_result', { 
                    status: "COMPLETED", 
                    output: customOutput, 
                    verdict: finalVerdict, 
                    questionId: payload.questionId 
                });
            });

        } catch (err) {
            console.error("Execution error:", err);
            socket.emit('execution_result', { verdict: 'Server Error', output: 'An internal error occurred.' });
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`[Node.js] API Gateway listening on http://localhost:${PORT}`));