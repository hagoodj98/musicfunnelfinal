import { useState, useEffect } from 'react';

export default function useSubscriptionState() {
    
    const [subscription, setSubscription] = useState(null);

    //On mount, load subscription data from localStorage (if any)
    useEffect(()=> {
        try {
            const storedSubscription = localStorage.getItem('pendingSubscription');
            if (storedSubscription) {
                const parsedData = JSON.parse(storedSubscription);
                setSubscription(parsedData);
            }
        } catch (err) {
            console.error('Error reading subscription from localStorage:', err);
        }
    },[]);
      // Save only the necessary fields, e.g., status and sessionToken
    const saveSubscription = (data) => {
        
        try {
            localStorage.setItem('pendingSubscription', JSON.stringify(data));
            setSubscription(data);
        } catch (err) {
            console.error('Error saving subscription to localStorage:', err);
        }
    }
    // Function to clear subscription data from localStorage
    const clearSubscription = () => {
        try {
            localStorage.removeItem('pendingSubscription');
            setSubscription(null);
        } catch (err) {
            console.error('Error clearing subscription from localStorage:', err);
        }
    };
    return {subscription, saveSubscription, clearSubscription};
}