//The purpose of this file to connect the server and the client. Whatever messages sent from the server, will be sent here, as long as the websocket connection is open.
//This is a customized hook called useWebSocket. It returns the send function and the current status immediately because this hook manages it own state.
//const {send, status} = useWebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKETURL}`);
//import { useWebSocket } from "../utils/websocket";

/*

  if (status === 'connected') {
            // Use `send` to initiate actions, like notifying server of client actions
            send({ 
                action: 'checkoutAborted', 
                sessionToken: sessionToken
            });
        }




                if (session.id) {
            if (status === 'connected') {
                send({ 
                    action: 'checkoutInitiatedAuth', 
                    sessionToken: session.sessionToken,
                    //The wsToken is used to authenticate once the websocket connection has been made. That way I can access the sessiontoken.
                    wsToken: session.wsToken
                });
            }
            */



import { useEffect, useState } from "react";

const isBrowser = typeof window !== "undefined";

// Hook to manage WebSocket connection and receive updates. This function returns two parameters, send and status
export const useWebSocket = (url) => {
    const [status, setStatus] = useState('disconnected');

    useEffect(() => {
        let ws;
        let retries = 0;
        const maxRetries = 5; // Maximum retries before giving up

        const connect = () => {
            setStatus('connecting');
            ws = new WebSocket(url);
    
            ws.onopen = () => {
                console.log('WebSocket connection established');
                setStatus('connected');
                retries = 0; // Reset retry count upon a successful connection
            };
            ws.onclose = event => {
                console.error('WebSocket connection closed', event);
                setStatus('disconnected');
                if (!event.wasClean && retries < maxRetries) {
                    retries++;
                    console.log(`WebSocket retrying connection... (${retries})`);
                    setTimeout(connect, Math.min(1000 * retries, 30000)); // Exponential backoff with a cap
                }
            };
            ws.onerror = error => {
                console.error('WebSocket encountered an error:', error);
                setStatus('error');
                ws.close(); // Ensure the socket is closed properly
            };
        //This catches when messages are received from the backend
            ws.onmessage = event => {
                console.log('Received message:', event.data);
                // Handle incoming messages
                handleMessage(event.data);
            };
        };
        // Start the WebSocket connection
        connect();
        // Function to handle incoming messages
        const handleMessage = (data) => {
            // Here you can parse and react to messages
            try {
                const message = JSON.parse(data);
                console.log("Processed message:", message);
                switch (message.action) {
                    case 'confirmation':
                        // Handle confirmation message
                        alert('Checkout confirmed!');
                        break;
                    case 'error':
                        // Handle error message
                        setError(message.error);
                        break;
                    default:
                        console.log('Unhandled message type');

                }

                // Further processing based on message content
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };
        //This is the clean up section of the useEffect hook
        return () => {
            ws.close();
        };
    },[url]); //Depending on which environment i am working in, the useEffect will rerun automatically on this change 
    
    return { 
        //This send function handles messages sent from the client and send to backend. This is typically used for client-initiated actions that need to inform the server of something that happened. 
        send: 
            (message) => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(message));
                } else {
                    console.error("WebSocket is not open. Cannot send message");
                }
            }
        ,
        status
    };
};
