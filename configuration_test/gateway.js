const net = require('net');

const SOCKET_PATH = '/tmp/rce_engine.sock';

console.log('[Node.js] Submitting code to Execution Engine...');

const client = net.createConnection({ path: SOCKET_PATH }, () => {
    // We send a mock user payload
    const payload = "Hello from the React Frontend! Please execute me.";
    client.write(payload);
});

// Listen for data coming BACK from the C++ Daemon
client.on('data', (data) => {
    console.log('\n--- FINAL RESULT RECEIVED IN NODE.JS ---');
    console.log(data.toString());
    console.log('----------------------------------------\n');
    
    // Disconnect after receiving the result
    client.end();
});

client.on('error', (err) => {
    console.error('[Node.js] Connection Error:', err.message);
});