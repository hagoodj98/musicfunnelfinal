'use client';

import { createContext, useContext, useEffect, useState } from "react";

const SubscriptionContext = createContext({
    userStatus: null, //user information if subscribed
    setUserEmail: () => {}, //adding setUserEmail method
    isLoading: true, //to track the initial loading state
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

    useEffect(() => {
        if (!userEmail) return;  //Don't fetch API endpoint if no email  
        //This function should contact my API that checks Redis status
        const checkSubscription = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/check-status?email=${encodeURIComponent(userEmail)}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserStatus(data.status); //Set user data
                } else {
                    throw new Error('Response not OK')
                }
                setLoading(false); //update loading state
            } catch (error) {
                console.error('Failed to fetch subscription status:', error);
                setLoading(false); //Ensure loading is false on error
            }
        };
        checkSubscription();
    }, [userEmail]); //Depend on userEmail
    
    return (
        <SubscriptionContext.Provider value={{userStatus, setUserEmail, isLoading }}>
            {children}
        </SubscriptionContext.Provider>
    );
}