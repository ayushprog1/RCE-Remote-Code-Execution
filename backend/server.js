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
// app.use(cors());
app.use(cors({
    origin: [
        "https://rce-theta.vercel.app", 
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json()); // Essential for reading POST data

// Connect to MongoDB
connectDB();

const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });
const io = new Server(server, { 
    cors: { 
        origin: [
            "https://rce-theta.vercel.app", 
            "http://localhost:5173", 
            "http://127.0.0.1:5173"
        ],
        methods: ["GET", "POST"],
        credentials: true
    } 
});

const SOCKET_PATH = '/tmp/rce_engine.sock';
const SUBMISSION_DIR = path.join(__dirname, 'submissions');

// --- MOUNT THE ROUTERS ---
// This tells Express: "If a request starts with /api/questions, send it to questionRoutes.js!"
app.use('/api/questions', questionRoutes);
app.use('/api/admin/questions', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// --- WEBSOCKET GRADING ENGINE ---
// --- WEBSOCKET GRADING ENGINE ---
io.on('connection', (socket) => {
    console.log(`[Socket.io] User connected: ${socket.id}`);

    socket.on('submit_code', async (payload) => {
        const question = await Question.findOne({ questionId: payload.questionId });
        if (!question) return socket.emit('execution_result', { verdict: 'Error: Question not found' });

        // Ensure the submissions directory exists!
        if (!fs.existsSync(SUBMISSION_DIR)){
            fs.mkdirSync(SUBMISSION_DIR);
        }

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
            console.error("Daemon connection failed. Is final_engine running?");
            customOutput = "Engine Offline.";
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
                    
                    // SAFELY check expected output
                    const expectedOutput = tc.expectedOutput ? tc.expectedOutput.trim() : "";

                    if (actualOutput !== expectedOutput) {
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
                const User = require('./models/User'); 
                await User.findByIdAndUpdate(
                    payload.userId,
                    { $addToSet: { solvedQuestions: payload.questionId } } 
                );
            }
        }

        socket.emit('execution_result', { status: "COMPLETED", output: customOutput, verdict: finalVerdict });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`[Node.js] API Gateway listening on port ${PORT}`));
// server.listen(PORT, () => console.log(`[Node.js] API Gateway listening on http://localhost:${PORT}`));