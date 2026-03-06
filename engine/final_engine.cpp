#include <iostream>
#include <string>
#include <curl/curl.h>
#include <nlohmann/json.hpp>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

using namespace std;
using json = nlohmann::json;

#define SOCKET_PATH "/tmp/rce_engine.sock"

// --- CURL CALLBACK ---
size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb; 
}

// --- DOCKER API HELPER ---
string SendDockerRequest(const string& endpoint, const string& method, const string& payload = "", long timeout_sec = 0) {
    CURL* curl = curl_easy_init();
    string responseBuffer;
    if(curl) {
        curl_easy_setopt(curl, CURLOPT_UNIX_SOCKET_PATH, "/var/run/docker.sock");
        curl_easy_setopt(curl, CURLOPT_URL, ("http://localhost" + endpoint).c_str());
        curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, method.c_str());
        
        struct curl_slist* headers = NULL;
        if (method == "POST" && !payload.empty()) {
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payload.c_str());
            headers = curl_slist_append(headers, "Content-Type: application/json");
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        }
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &responseBuffer);
        if (timeout_sec > 0) curl_easy_setopt(curl, CURLOPT_TIMEOUT, timeout_sec);

        CURLcode res = curl_easy_perform(curl);
        if (res == CURLE_OPERATION_TIMEDOUT) {
            if (headers) curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            return "TIMEOUT_TRIGGERED";
        }
        if (headers) curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    return responseBuffer;
}

int main() {
    cout << "[Vault Guard] Booting up Ultimate C++ Execution Daemon..." << endl;

    // --- 1. SET UP THE IPC SOCKET ---
    int server_fd = socket(AF_UNIX, SOCK_STREAM, 0);
    struct sockaddr_un addr;
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, SOCKET_PATH, sizeof(addr.sun_path) - 1);

    unlink(SOCKET_PATH); 
    bind(server_fd, (struct sockaddr*)&addr, sizeof(addr));
    listen(server_fd, 5);

    cout << "[Vault Guard] Listening on " << SOCKET_PATH << "...\n" << endl;

    // --- 2. THE INFINITE LISTENING LOOP ---
    while (true) {
        int client_fd = accept(server_fd, NULL, NULL);
        
        // Read the file path sent by Node.js
        char path_buffer[1024] = {0};
        read(client_fd, path_buffer, sizeof(path_buffer) - 1);
        string filePath(path_buffer);
        
        cout << "\n[Vault Guard] Received new task! File: " << filePath << endl;

        // Extract the directory (e.g., /home/user/rce/submissions) so we can mount it
        string dirPath = filePath.substr(0, filePath.find_last_of('/'));
        string bindMount = dirPath + ":/usr/src/app";

        // --- 3. DOCKER ORCHESTRATION ---
        json config = {
            {"Image", "gcc:latest"},
            {"Tty", true},
            {"WorkingDir", "/usr/src/app"}, // Set the starting folder inside the container
            // The command: Compile solution.cpp, and if successful (&&), run it!
            {"Cmd", {"bash", "-c", "g++ solution.cpp -o exec && ./exec < input.txt"}},
            {"HostConfig", {
                {"Binds", {bindMount}}, // Mount the submissions folder!
                {"Memory", 268435456},   // 10MB limit
                {"NetworkMode", "none"} // No internet
            }}
        };

        string createResp = SendDockerRequest("/containers/create", "POST", config.dump());
        json createJson = json::parse(createResp);
        string containerId = createJson["Id"];
        
        SendDockerRequest("/containers/" + containerId + "/start", "POST");
        
        // Wait with a 2-second timeout
        string waitResp = SendDockerRequest("/containers/" + containerId + "/wait", "POST", "", 2);

        // --- 4. AUTOPSY & DIAGNOSIS ---
        string diagnosis = "";
        if (waitResp == "TIMEOUT_TRIGGERED") {
            diagnosis = "TIME LIMIT EXCEEDED (TLE)";
            SendDockerRequest("/containers/" + containerId + "/kill", "POST");
        } else {
            json waitJson = json::parse(waitResp);
            int exitCode = waitJson["StatusCode"];
            string inspectResp = SendDockerRequest("/containers/" + containerId + "/json", "GET");
            json inspectJson = json::parse(inspectResp);
            bool oomKilled = inspectJson["State"]["OOMKilled"];
            
            if (oomKilled) diagnosis = "MEMORY LIMIT EXCEEDED (MLE)";
            else if (exitCode != 0) diagnosis = "COMPILATION OR RUNTIME ERROR (RE)";
            else diagnosis = "SUCCESSFUL EXECUTION";
        }

        // --- 5. FETCH LOGS ---
        string logs = SendDockerRequest("/containers/" + containerId + "/logs?stdout=true&stderr=true", "GET");
        string cleanLogs = logs.empty() ? "No Output." : logs;

        // --- 6. CLEANUP CONTAINER ---
        SendDockerRequest("/containers/" + containerId + "?v=true", "DELETE");

        // --- 7. SEND RESULTS BACK TO NODE.JS ---
        string finalPayload = "DIAGNOSIS: " + diagnosis + "\n\nOUTPUT:\n" + cleanLogs;
        write(client_fd, finalPayload.c_str(), finalPayload.length());
        close(client_fd);
        
        cout << "[Vault Guard] Task finished and results sent to API Gateway!" << endl;
    }

    close(server_fd);
    unlink(SOCKET_PATH);
    return 0;
}