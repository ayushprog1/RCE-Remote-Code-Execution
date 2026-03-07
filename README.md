# 🚀 Remote Code Execution (RCE) Platform

A full-stack, distributed Remote Code Execution engine built to safely compile and run untrusted C++ code in real-time. This platform simulates the core infrastructure of competitive programming sites like LeetCode or Codeforces. 

Built with a **Microservices Architecture**, the system separates the user-facing API from the core execution engine to ensure maximum security, scalability, and crash resistance.

## 🏗️ Tech Stack

* **Frontend:** React.js, Tailwind CSS (Vercel)
* **API Gateway:** Node.js, Express.js, Socket.io
* **Database:** MongoDB
* **Execution Engine:** C++ Daemon, Docker Engine API, Unix Domain Sockets (IPC)
* **Infrastructure:** AWS EC2, Nginx Reverse Proxy, Let's Encrypt SSL/TLS

## 🧠 System Architecture & Workflow

When a user clicks "Submit", here is the exact journey of their code:

1. **The Request:** The React frontend sends the raw C++ code to the Node.js API Gateway via WebSockets.
2. **The Handoff:** The API Gateway writes the code to a file and passes the file path to a standalone C++ Execution Daemon via a high-speed Unix Domain Socket.
3. **The Sandbox:** The C++ Daemon talks directly to the Docker Engine to spin up an ephemeral, heavily restricted container (`gcc:latest`). 
4. **Execution & Limits:** The untrusted code is compiled and executed inside the container. Network access is completely disabled, memory is hard-capped at 256 MB, and a 2.0-second timeout is enforced to prevent infinite loop attacks (Time Limit Exceeded).
5. **The Verdict:** The container's output is captured, the container is instantly destroyed, and the output is graded against hidden test cases in MongoDB. The final verdict ("Accepted", "Wrong Answer", etc.) is streamed back to the frontend.

## 🛡️ Security Features

* **Network Isolation:** Docker containers are run with `--network none` to prevent external API calls or data exfiltration.
* **Resource Quotas:** Hard limits on RAM prevent Memory Limit Exceeded (MLE) and Out-Of-Memory (OOM) host crashes.
* **Timeout Watchdog:** A strict 2-second timeout safely kills containers trapped in infinite loops.
* **Encrypted Traffic:** Nginx reverse proxy handles WSS/HTTPS traffic with SSL certificates from Let's Encrypt.

---

## 🛠️ Local Setup & Installation

If you want to run this platform locally on your machine, you will need **Node.js**, a **C++ Compiler (g++)**, and **Docker Desktop** installed.

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/RCE-Remote-Code-Execution.git](https://github.com/yourusername/RCE-Remote-Code-Execution.git)
cd RCE-Remote-Code-Execution
```

### 2. Set up the Environment Variables
Inside the `backend` folder, create a `.env` file and add your MongoDB connection string:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/rce_platform
```

### 3. Start the Node.js API Gateway
Open a terminal in the `backend` folder:
```bash
cd backend
npm install
node seed.js    # Injects the coding problems into your database
npm run start
```

### 4. Start the C++ Execution Daemon
Open a *second* terminal in the `engine` folder. You must compile the daemon and run it (requires `libcurl` and `nlohmann/json` installed on your system):
```bash
cd engine
g++ final_engine.cpp -o rce_daemon -lcurl
sudo ./rce_daemon
```
*(Note: `sudo` is required because the daemon needs permission to orchestrate Docker containers).*

### 5. Start the React Frontend
Open a *third* terminal in the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173` in your browser!

---

## 🚀 Production Deployment (AWS / Linux)

In a live production environment, both backend microservices should be managed by a process manager like **PM2** to keep them running continuously.

**Starting the cluster:**
```bash
# 1. Start the API Gateway
cd backend
sudo pm2 start server.js --name "api-gateway"

# 2. Start the Docker Execution Daemon
cd ../engine
sudo pm2 start ./rce_daemon --name "cpp-engine"

# 3. Save the process list to reboot automatically if the server restarts
sudo pm2 save
```
