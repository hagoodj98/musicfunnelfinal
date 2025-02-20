'use client';


import { useEffect, useState } from 'react';
import Timer from './Timer';
import RefreshPopup from './RefreshPopup';

//This is a parent that watches the timer (child component) telling it to do something in order for the parent to decides when to show the popup.

//WHAT IT DOES****

//It tells the Timer how long the session should last (for example, 3600 seconds or 1 hour).
//It listens for a warning from the Timer when time is running low (like when only 60 seconds are left).
//When that warning happens, it makes the popup appear (by setting a state like showPopup to true).

const SessionManager = ({ initialTime }) => { //the time is set by SessionManager (provided by /session-info endpoint), the parent component because there is a prop within it called initialTime. And that prop is passed to the Timer component (child component). The thing to remember about props is to think about what would be needed for the component to work in the application.  

//According to the comments above, it listens for a warning, from the timer when to show the popup. You need a state for that, which is set here
    const [showPopup, setShowPopup] = useState(false);
//In order for it to listen to when to show the popup, it needs to know the current time. This is the responsibly that the parent gave to the child so that the parent can do what they were designed to do.
    const [timeLeft, setTimeLeft] = useState(initialTime);
      // We'll store the current session status here (e.g., 'initiated', 'completed', 'cancelled')
    const [checkoutStatus, setCheckoutStatus]= useState(null);
    


    useEffect(() => {
// On mount, check sessionStorage to see if the popup was open and restore the timeLeft
//When the component mounts, it checks sessionStorage for the key 'popupOpen'. If it finds 'true', it means the popup was open before the refresh. It then reads the stored 'timeLeft' (if available) to restore the timer state.
        const storedPopupOpen = sessionStorage.getItem('popupOpen');
        const storedTimeLeft = sessionStorage.getItem('timeLeft');
        if (storedPopupOpen === 'true') {
            setShowPopup(true);
            if (storedTimeLeft) {
                setTimeLeft(parseInt(storedTimeLeft, 10));
            }
        }
    }, []);

// Polling effect to fetch the session data periodically (or use your existing polling mechanism)
    useEffect(() => {
        async function fetchSessionData() {
        try {
            const res = await fetch('/api/session-info'); // Should return JSON including checkoutStatus
            if (res.ok) {
            const data = await res.json();
            setCheckoutStatus(data.checkoutStatus);
            }
        } catch (error) {
            console.error('Error fetching session data:', error);
        }
        }
// Poll every 10 seconds
        fetchSessionData();
        const intervalId = setInterval(fetchSessionData, 10000);
        return () => clearInterval(intervalId);
    }, []);

    //This ensures that even if the Timer or any other logic would normally trigger the popup (like when time runs low), if the session status is “completed” the popup will not appear.
    useEffect(() => {
        if (checkoutStatus === 'initiated' || checkoutStatus === 'cancelled') {
          setShowPopup(true);
        } else {
          setShowPopup(false);
        }
      }, [checkoutStatus]);

    // This callback gets called every second by Timer. Some parents have to keep an eye on their children to make sure, the children do the work they were asked. This updateTimeLeft does the same thing. Its an eye.
    const updateTimeLeft = (timeLeft) => {
        //It get the current time from Timer using the timeLeft parameter, which is the timeLeft variable over at Timer is set by setTimeLeft, which transfers the current time from over at Timer to over here at SessionManager.
        setTimeLeft(timeLeft);
         // Every time the Timer updates the time left (using the onTimeUpdate callback), we store the current time in sessionStorage so it’s available after a refresh.
        sessionStorage.setItem('timeLeft', timeLeft.toString())
    };
    // This callback is called when Timer reaches 60 seconds left. This is what the child is responsible for. To let their parent know when they are done. These timeLeft parameters you see in handleWarning and updateTimeLeft comes from the child(Timer). And the setTimeLeft is how the parent keeps an eye on the child. Everything parent child relationship is a bit different, so the interaction may vary depending on the project.
    const handleWarning = (timeLeft) => {
        if (checkoutStatus !== 'completed') {
            setShowPopup(true);
            setTimeLeft(timeLeft); // Update state with current time
//When the Timer warns (at 60 seconds), we set showPopup to true and store 'popupOpen' as 'true' along with the current time left.
            sessionStorage.setItem('popupOpen', 'true');
            sessionStorage.setItem('timeLeft', timeLeft.toString());
        }
    };
// When the Timer expires, take appropriate action (e.g., redirect). We just call this function over at the Timer component since the Timer is keeping track anyway. We send this function as a prop to Timer. 
    const handleExpire = () => {
        // For example, redirect the user or take other actions
        alert("Redirecting to squeeze page");
        window.location.href = '/';
    }
//When the user closes the popup (by clicking “Nope!” or after a successful refresh), we remove the 'popupOpen' flag from sessionStorage. This ensures the popup doesn’t automatically reappear on the next refresh if the user has dismissed it.
    const handleClosePopup = () => {
        setShowPopup(false);
        sessionStorage.removeItem('popupOpen');
    };
    return (
        <div>
            {/* here the initialTime is set, which is being sent to the Timer component. Then the Timer will have a prop called initialTime. The onWarning function is sent to Timer, cause Timer is suppose to let SessionManager know when 60 secs is left. Its like a reminder for SessionManager to know when to disply the popup.  The onTimeUpdate is the parent keeping an eye on the Timer*/}
            <Timer initialTime={initialTime} onTimeUpdate={updateTimeLeft} onWarning={handleWarning} onExpire={handleExpire}/>
            {showPopup && (      
//This makes the 60 second countdown dynamic. We send the timeLeft value to the RefreshPopup. Also, we have to remember that there is a close button to. If this function gets called, onclose will tell SessionManagerProvider to remove the popup. 
            <RefreshPopup timeLeft={timeLeft} onClose={handleClosePopup} />
            )}
        </div>
  )
}

export default SessionManager;
