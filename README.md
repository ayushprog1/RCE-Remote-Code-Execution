# 🚀 Remote Code Execution (RCE) Platform

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![C++](https://img.shields.io/badge/c++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

A full-stack, distributed Remote Code Execution engine built to safely compile and run untrusted C++ code in real-time. This platform simulates the core infrastructure of competitive programming sites like LeetCode or CodeChef.

Built with a **Microservices Architecture**, the system separates the user-facing API from the core execution engine to ensure maximum security, scalability, and crash resistance.

## 🏗️ Tech Stack

* **Frontend:** React.js, Tailwind CSS (Deployed on Vercel)
* **API Gateway:** Node.js, Express.js, Socket.io
* **Database:** MongoDB
* **Execution Engine:** C++ Daemon, Docker Engine API, Unix Domain Sockets (IPC)
* **Infrastructure:** AWS EC2, Nginx Reverse Proxy, Let's Encrypt SSL/TLS

## 🧠 How it Works (Under the Hood)

When a user clicks "Submit", here is the exact journey of their code:
1. **The Request:** The React frontend sends the raw C++ code to the Node.js API Gateway via WebSockets.
2. **The Handoff:** The API Gateway writes the code to a file and passes the file path to a standalone C++ Execution Daemon via a high-speed Unix Domain Socket.
3. **The Sandbox:** The C++ Daemon talks directly to the Docker API to spin up an ephemeral, heavily restricted container (`gcc:latest`).
4. **Execution & Limits:** The untrusted code is compiled and executed inside the container. Network access is completely disabled, memory is hard-capped at 256 MB, and a 2.0-second timeout is enforced to prevent infinite loop attacks (Time Limit Exceeded).
5. **The Verdict:** The container's output is captured, the container is instantly destroyed, and the output is graded against hidden test cases in MongoDB. The final verdict ("Accepted", "Wrong Answer", etc.) is streamed back to the frontend.

---

## 🛠️ Local Setup & Installation

To run this platform locally on your machine, you will need **Node.js**, a **C++ Compiler (g++)**, and **Docker Desktop** installed.

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/RCE-Remote-Code-Execution.git](https://github.com/yourusername/RCE-Remote-Code-Execution.git)
cd RCE-Remote-Code-Execution
