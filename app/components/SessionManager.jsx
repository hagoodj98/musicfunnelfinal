'use client';


import { useState } from 'react';
import Timer from './Timer';
import RefreshPopup from './RefreshPopup';

//This parent component watches the timer and decides when to show the popup.

//WHAT IT DOES****

//It tells the Timer how long the session should last (for example, 3600 seconds or 1 hour).
//It listens for a warning from the Timer when time is running low (like when only 60 seconds are left).
//When that warning happens, it makes the popup appear (by setting a state like showPopup to true).

const SessionManager = ({ initialTime }) => { //the time is set by SessionManager, the parent component because there is a prop within it called initialTime. And that prop is passed to the Timer component (child component)

//Accoring to the comments above, it listens for a warning, from the timer when to show the popup. You need a state for that, which is set here
    const [showPopup, setShowPopup] = useState(false);
//In order for it to listen to when to show the popup, it needs to know the current time
    const [timeLeft, setTimeLeft] = useState(initialTime);

     // This callback gets called every second by Timer
    const updateTimeLeft = (timeLeft) => {
        //It get the current time from Timer, and the timeLeft parameter, which is the timeLeft variable over at Timer is set by setTimeLeft, which transfers the current time over there at Timer to over here in at SessionManager
        setTimeLeft(timeLeft);
    };
    // This callback is called when Timer reaches 60 seconds left.
    const handleWarning = (timeLeft) => {
        setShowPopup(true);
        setTimeLeft(timeLeft); // Update state with current time
    };
     
  // When the Timer expires, take appropriate action (e.g., redirect)
    const handleExpire = () => {
        // For example, redirect the user or take other actions
        alert("Redirecting to squeeze page");
        window.location.href = '/';
    }
  
    return (
        <div>
            {/* here the initialTime is set, which is being sent to the Timer component. Then the Timer will have a prop called initialTime. The onWarning function is sent to Timer, cause Timer is suppose to let SessionManager know when 60 secs is left. Its like a reminder for SessionManager to disply the popup.  */}
            <Timer initialTime={initialTime} onTimeUpdate={updateTimeLeft} onWarning={handleWarning} onExpire={handleExpire}/>
            {showPopup && (
                <RefreshPopup timeLeft={60} onclose={() => setShowPopup(false)} />
            )}
        
        </div>
  )
}

export default SessionManager;
