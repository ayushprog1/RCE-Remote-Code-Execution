#include <iostream>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>
#include <sys/wait.h>
#include <cstring>

#define SOCKET_PATH "/tmp/rce_engine.sock"

int main() {
    std::cout << "[Daemon] Booting up Execution Manager..." << std::endl;

    int server_fd = socket(AF_UNIX, SOCK_STREAM, 0);
    struct sockaddr_un addr;
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, SOCKET_PATH, sizeof(addr.sun_path) - 1);

    unlink(SOCKET_PATH); 
    bind(server_fd, (struct sockaddr*)&addr, sizeof(addr));
    listen(server_fd, 5);

    std::cout << "[Daemon] Listening on " << SOCKET_PATH << "..." << std::endl;

    // PRODUCTION NOTE: We use an infinite loop here so the daemon stays alive 
    // to handle multiple requests, just like a real server.
    while (true) {
        int client_fd = accept(server_fd, NULL, NULL);
        std::cout << "\n[Daemon] New task received from API Gateway!" << std::endl;

        // 1. Read payload from Node.js
        char payload_buffer[1024] = {0};
        read(client_fd, payload_buffer, sizeof(payload_buffer) - 1);

        // 2. Set up the pipe for capturing output
        int pipefd[2];
        pipe(pipefd);

        // 3. Fork the process
        pid_t pid = fork();

        if (pid == 0) {
            // --- CHILD PROCESS ---
            close(client_fd); // Child doesn't need the socket
            close(pipefd[0]); // Child only writes to the pipe
            
            dup2(pipefd[1], STDOUT_FILENO); // Redirect stdout to pipe
            close(pipefd[1]);

            // Execute a simple echo command using the payload Node.js sent
            char* args[] = {(char*)"echo", payload_buffer, NULL};
            execvp(args[0], args);
            exit(1); 
        } else {
            // --- PARENT PROCESS ---
            close(pipefd[1]); // Parent only reads from the pipe

            // Wait for the child (prevent zombies)
            int status;
            waitpid(pid, &status, 0);

            // Read the trapped output
            char output_buffer[1024] = {0};
            ssize_t bytesRead = read(pipefd[0], output_buffer, sizeof(output_buffer) - 1);
            close(pipefd[0]); // Close pipe read end (prevent FD leaks!)

            // Send the trapped output BACK to Node.js over the socket
            write(client_fd, output_buffer, bytesRead);
            
            std::cout << "[Daemon] Task executed and results sent back to Node.js." << std::endl;
            
            close(client_fd); // Close the client socket (prevent FD leaks!)
        }
    }

    // We will never reach here because of the infinite loop, but good practice.
    close(server_fd);
    unlink(SOCKET_PATH);
    return 0;
}