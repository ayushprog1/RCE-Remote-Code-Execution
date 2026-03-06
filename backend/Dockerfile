# 1. Start with a lightweight Linux machine that already has Node.js installed
FROM node:18-bullseye-slim

# 2. Update Linux and install the C++ Compiler (g++)
RUN apt-get update && \
    apt-get install -y g++ && \
    rm -rf /var/lib/apt/lists/*

# 3. Set up our working directory inside the container
WORKDIR /app

# 4. Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# 5. Copy the rest of your backend code into the container
COPY . .

# 6. Expose port 3000 so the outside world can connect
EXPOSE 3000

# 7. Start the server!
CMD ["node", "server.js"]