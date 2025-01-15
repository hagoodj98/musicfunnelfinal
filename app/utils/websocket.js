
const isBrowser = typeof window !== "undefined";

// Create WebSocket connection only if in the browser
function createWebSocket(url, maxRetries = 5) {
    let retries = 0;
    let ws;
    
    function connect() {
        if (!isBrowser) return null;
        ws = new WebSocket(url);
        ws.onopen = () => {
            console.log('WebSocket connection established');
            retries = 0; // Reset retry count upon a successful connection
        };
        ws.onclose = (event) => {
            console.error('WebSocket connection closed', event);
            if (!event.wasClean && retries < maxRetries) {
                setTimeout(() => {
                    console.log(`Attempting to reconnect...(${++retries})`);
                    connect(); //Attempt to reconnect
                }, Math.min(1000 * retries, 30000)); //Exponential backoff with a cap
            };
        }
        ws.onerror = (error) => {
            console.error('WebSocket encountered an error: ', error);
            ws.close(); //Ensure the socket is closed properly
        };
        ws.onmessage = (event) => {
            console.log('Received message: ', event.data);
        };
        return ws;
    }
    //This restarts the connection attempt
    return connect();
}

export const wsInstance = createWebSocket('ws://localhost:8080');