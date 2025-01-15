'use client';

import { createContext, use, useContext, useEffect, useMemo, useState } from "react";
import { wsInstance } from '../utils/websocket';

const SubscriptionContext = createContext({
    userStatus: null, //user information if subscribed
    setUserEmail: () => {}, //adding setUserEmail method
    isLoading: true, //to track the initial loading state
    sendMessage: () => {} // Function to send messages through WebSocket
});


//Provider component
export const SubscriptionProvider = ({ children }) => {
    const [userStatus, setUserStatus] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [userEmail, setUserEmail]= useState('');
    const [ws, setWs] = useState(null);
   
  // Function to initialize WebSocket
  const initializeWebSocket = () => {
    if (!wsInstance) return;

    wsInstance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'statusUpdate') {
            setUserStatus(data.status);
            setLoading(false);
        }
    };
    wsInstance.onopen = () => {
        console.log("WebSocket connection established");
        setLoading(false);
    };

    wsInstance.onerror = (error) => {
        console.error('WebSocket error:', error);
        setLoading(true);
    };

    wsInstance.onclose = () => {
        console.error("WebSocket is closed. Reconnecting...");
        setLoading(true);
        setTimeout(initializeWebSocket, 2000); // Reconnect after 2 seconds
    };
    
    setWs(wsInstance);
};
  // Initialize WebSocket connection
  useEffect(() => {
    initializeWebSocket();
    return () => {
        if (ws) {
            ws.close();  // Clean up WebSocket connection on unmount                
        }
    };
}, []);
const contextValue = useMemo(() => ({
    userStatus,
    isLoading,
    userEmail,
    setUserEmail: (email) => {}, // Implement as needed
    sendMessage: (message) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        } else {
            console.error("WebSocket is not open. Attempting to reconnect...");
            initializeWebSocket();
        }
    }
}), [userStatus, isLoading]);

    return (
        <SubscriptionContext.Provider value={contextValue}>
            {children}
        </SubscriptionContext.Provider>
    );
}
//Hook for easy context usage
export const useSubscription = () => {
    return useContext(SubscriptionContext);
}
