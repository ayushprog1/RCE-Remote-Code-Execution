#include <iostream>
#include <string>
#include <curl/curl.h> // The HTTP library

using namespace std;

// ---------------------------------------------------------
// THE CALLBACK FUNCTION
// libcurl calls this function automatically whenever Docker 
// sends data back. It might call it multiple times for large data.
// ---------------------------------------------------------
size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    // Cast the 'userp' pointer back to a string and append the incoming data
    ((string*)userp)->append((char*)contents, size * nmemb);
    
    // Return the number of bytes processed so libcurl knows we handled them
    return size * nmemb; 
}

int main() {
    cout << "Initializing libcurl..." << endl;
    
    CURL* curl;
    CURLcode res;
    string readBuffer; // This will hold Docker's JSON response

    curl = curl_easy_init();
    
    if(curl) {
        // 1. Tell curl to completely ignore the network and use Docker's local file socket
        curl_easy_setopt(curl, CURLOPT_UNIX_SOCKET_PATH, "/var/run/docker.sock");
        
        // 2. We still format the request like a web URL. 
        // "localhost" is ignored by the socket, but /info is the API endpoint we want.
        curl_easy_setopt(curl, CURLOPT_URL, "http://localhost/info");
        
        // 3. Tell curl exactly WHERE to put the data when it arrives (our callback)
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        
        // 4. Pass the memory address of our readBuffer so the callback can fill it
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);

        cout << "Sending GET request to Docker Daemon..." << endl;
        
        // 5. Fire the request! This blocks until the response is fully received.
        res = curl_easy_perform(curl);
        
        // PRODUCTION CHECK: Did the HTTP request fail?
        if(res != CURLE_OK) {
            cerr << "CRITICAL ERROR: Failed to talk to Docker: " << curl_easy_strerror(res) << endl;
            // Common fix: You might need to run the script with 'sudo' if permissions deny access to docker.sock
        } else {
            cout << "\n--- DOCKER DAEMON RESPONSE (First 300 chars) ---" << endl;
            // The JSON is huge, so we only print the beginning
            cout << readBuffer.substr(0, 300) << "...\n" << endl; 
            cout << "SUCCESS! C++ is talking to Docker." << endl;
        }
        
        // 6. Cleanup to prevent memory leaks!
        curl_easy_cleanup(curl);
    }
    
    return 0;
}