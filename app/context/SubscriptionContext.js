'use client';

import { createContext, useContext, useEffect, useState } from "react";

const SubscriptionContext = createContext({
    userStatus: null, //user information if subscribed
    isLoading: true, //to track the initial loading state
});

//Hook for easy context usage
export const useSubscription = () => {
    return useContext(SubscriptionContext);
}

//Provider component
export const SubscriptionProvider = ({ children }) => {
    const [userStatus, setUserStatus] = useState(null);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        //This function should contact my API that checks Redis status
        const checkSubscription = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/check-status');
                const data = await response.json();
                setUserStatus(data.status); //Set user data
                setLoading(false); //update loading state
            } catch (error) {
                console.error('Failed to fetch subscription status:', error);
                setLoading(false); //Ensure loading is false on error
            }
        };
        checkSubscription();
    }, []);
    
    return (
        <SubscriptionContext.Provider value={{userStatus,isLoading }}>
            {children}
        </SubscriptionContext.Provider>
    );
}