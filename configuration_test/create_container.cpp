#include <iostream>
#include <string>
#include <curl/curl.h>
#include <nlohmann/json.hpp> // The JSON library

using namespace std;
using json = nlohmann::json;

// The callback to capture Docker's response
size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb; 
}

int main() {
    cout << "Drafting container blueprint..." << endl;

    // 1. Create the JSON payload (The Order Form)
    json container_config = {
        {"Image", "gcc:latest"}, // Use the C++ image we just pulled
        {"Cmd", {"echo", "Hello from inside the isolated Docker sandbox!"}}, // The command to run
        {"HostConfig", {
            {"AutoRemove", true} // PRODUCTION CHECK: This makes the container Ephemeral! It deletes itself when done.
        }}
    };

    string json_payload = container_config.dump();
    cout << "Payload: " << json_payload << endl;

    CURL* curl;
    CURLcode res;
    string readBuffer;

    curl = curl_easy_init();
    
    if(curl) {
        curl_easy_setopt(curl, CURLOPT_UNIX_SOCKET_PATH, "/var/run/docker.sock");
        
        // 2. The endpoint to CREATE a container
        curl_easy_setopt(curl, CURLOPT_URL, "http://localhost/containers/create");
        
        // 3. We must tell libcurl we are sending a POST request, not a GET request
        curl_easy_setopt(curl, CURLOPT_POST, 1L);
        
        // 4. Attach our JSON string to the request
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_payload.c_str());

        // 5. We MUST tell Docker that the data we are sending is JSON, otherwise it will reject it.
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);

        cout << "Sending POST request to Docker Daemon to create container..." << endl;
        
        res = curl_easy_perform(curl);
        
        if(res != CURLE_OK) {
            cerr << "CRITICAL ERROR: " << curl_easy_strerror(res) << endl;
        } else {
            cout << "\n--- DOCKER RESPONSE ---" << endl;
            cout << readBuffer << endl;
            
            // Parse the response to extract the Container ID
            try {
                json response_json = json::parse(readBuffer);
                if (response_json.contains("Id")) {
                    cout << "\nSUCCESS! Container created with ID: " << response_json["Id"] << endl;
                } else {
                    cout << "\nWARNING: Docker rejected the request. Check the response above." << endl;
                }
            } catch (json::parse_error& e) {
                cerr << "Failed to parse Docker's response as JSON." << endl;
            }
        }
        
        // Cleanup
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    
    return 0;
}