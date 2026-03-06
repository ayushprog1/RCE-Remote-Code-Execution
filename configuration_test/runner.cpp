#include <iostream>
#include <string>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb; 
}

// 1. UPDATED HELPER: We added a 'timeout_sec' parameter. Default is 0 (wait forever).
string SendDockerRequest(const string& endpoint, const string& method, const string& payload = "", long timeout_sec = 0) {
    CURL* curl = curl_easy_init();
    string responseBuffer;

    if(curl) {
        curl_easy_setopt(curl, CURLOPT_UNIX_SOCKET_PATH, "/var/run/docker.sock");
        string url = "http://localhost" + endpoint;
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, method.c_str());
        
        struct curl_slist* headers = NULL;
        if (method == "POST" && !payload.empty()) {
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payload.c_str());
            headers = curl_slist_append(headers, "Content-Type: application/json");
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        }

        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &responseBuffer);

        // 2. APPLY THE TIMEOUT: If we passed a time limit, enforce it on the HTTP request!
        if (timeout_sec > 0) {
            curl_easy_setopt(curl, CURLOPT_TIMEOUT, timeout_sec);
        }

        CURLcode res = curl_easy_perform(curl);
        
        // 3. CATCH THE TIMEOUT: If curl stopped because time ran out, return a special flag.
        if (res == CURLE_OPERATION_TIMEDOUT) {
            if (headers) curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            return "TIMEOUT_TRIGGERED";
        } else if (res != CURLE_OK) {
            cerr << "[Error] curl failed: " << curl_easy_strerror(res) << endl;
        }
        
        if (headers) curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    return responseBuffer;
}

int main() {
    cout << "[Orchestrator] Starting TLE Diagnostic Engine..." << endl;

    // 1. CREATE
    json config = {
        {"Image", "gcc:latest"},
        // --- NEW MALICIOUS PAYLOAD ---
        // This is a pure CPU infinite loop. It allocates no memory, but runs forever.
        {"Cmd", {"bash", "-c", "while true; do true; done"}},
        {"HostConfig", {
            {"Memory", 10485760}, // Keep memory limit just in case
            {"NetworkMode", "none"}
        }}
    };
    
    cout << "\n1. Creating container..." << endl;
    string createResp = SendDockerRequest("/containers/create", "POST", config.dump());
    json createJson = json::parse(createResp);
    string containerId = createJson["Id"];
    cout << "   -> Container ID: " << containerId.substr(0, 12) << endl;

    // 2. START
    cout << "2. Starting container..." << endl;
    SendDockerRequest("/containers/" + containerId + "/start", "POST");

    // 3. WAIT (WITH A 2 SECOND TIMEOUT!)
    cout << "3. Waiting for code execution to finish (Max 2 seconds)..." << endl;
    
    // We pass '2' as the 4th argument to trigger our new timeout logic
    string waitResp = SendDockerRequest("/containers/" + containerId + "/wait", "POST", "", 2);

    cout << "\n========================================" << endl;
    if (waitResp == "TIMEOUT_TRIGGERED") {
        // --- TLE TRIGGERED ---
        cout << "[DIAGNOSIS]: TIME LIMIT EXCEEDED (TLE)!" << endl;
        cout << "The code took longer than 2 seconds. Firing SIGKILL..." << endl;
        
        // We must forcefully kill the container, otherwise it keeps running in the background!
        SendDockerRequest("/containers/" + containerId + "/kill", "POST");
        cout << "Container assassinated successfully." << endl;
        
    } else {
        // --- NORMAL COMPLETION OR MLE (From previous step) ---
        json waitJson = json::parse(waitResp);
        int exitCode = waitJson["StatusCode"];
        
        string inspectResp = SendDockerRequest("/containers/" + containerId + "/json", "GET");
        json inspectJson = json::parse(inspectResp);
        bool oomKilled = inspectJson["State"]["OOMKilled"];
        
        if (oomKilled) {
            cout << "[DIAGNOSIS]: MEMORY LIMIT EXCEEDED (MLE)!" << endl;
        } else if (exitCode != 0) {
            cout << "[DIAGNOSIS]: RUNTIME ERROR (RE)! Exit Code: " << exitCode << endl;
        } else {
            cout << "[DIAGNOSIS]: SUCCESSFUL EXECUTION!" << endl;
        }
    }
    cout << "========================================\n" << endl;

    // 4. CLEANUP / SCRAPYARD
    cout << "\n4. Destroying container..." << endl;
    SendDockerRequest("/containers/" + containerId + "?v=true", "DELETE");
    cout << "   -> Container deleted successfully." << endl;

    return 0;
}