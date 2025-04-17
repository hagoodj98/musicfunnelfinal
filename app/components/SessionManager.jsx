'use client';


import { useState } from 'react';
import Timer from './Timer';
import RefreshPopup from './RefreshPopup';
import useSubscriptionState from '../hooks/useSubscriptionState';

const SessionManager = ({ initialTime }) => { 

    const { clearSubscription }=useSubscriptionState();

    const [showPopup, setShowPopup] = useState(false);
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const updateTimeLeft = (timeLeft) => {
        setTimeLeft(timeLeft);
    };
    const handleWarning = (timeLeft) => {
        setShowPopup(true);
        setTimeLeft(timeLeft); // Update state with current time
    };
    const handleExpire = () => {
        // For example, redirect the user or take other actions
        alert("Redirecting back to squeeze page.");
        clearSubscription();
        window.location.href = '/';
    }
    const handleClosePopup = () => {
        setShowPopup(false);
    };

    return (
        <div>
            
            <Timer initialTime={initialTime} onTimeUpdate={updateTimeLeft} onWarning={handleWarning} onExpire={handleExpire}/>
            {showPopup && (      
            <RefreshPopup timeLeft={timeLeft} onClose={handleClosePopup} />
            )}
        </div>
  )
}

export default SessionManager;
