'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { wsInstance } from '../utils/websocket';
import { error } from "node:console";

const SubscriptionContext = createContext({
    userStatus: null, //user information if subscribed
    setUserEmail: () => {}, //adding setUserEmail method
    isLoading: true, //to track the initial loading state
    sendMessage: () => {} // Function to send messages through WebSocket
});

//Hook for easy context usage
export const useSubscription = () => {
    return useContext(SubscriptionContext);
}

//Provider component
export const SubscriptionProvider = ({ children }) => {
    const [userStatus, setUserStatus] = useState(null);
    const [userEmail, setUserEmail]= useState(''); // Manage email in context
    const [isLoading, setLoading] = useState(true);
    const [ws, setWs] = useState(null);

    // Initialize WebSocket connection
    useEffect(() => {
        setWs(wsInstance);
        
         wsInstance.onopen = () => {
            console.log("WebSocket connection established");
        };

        wsInstance.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'statusUpdate') {
                setUserStatus(data.status);
            }
        };

        wsInstance.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            wsInstance.close(); //Clean up WebSocket connection on unmount
        }
    }, []);

    return (
        <SubscriptionContext.Provider value={{userStatus, setUserEmail, isLoading, sendMessage: (message) => wsInstance.send(message) }}>
            {children}
        </SubscriptionContext.Provider>
    );
}