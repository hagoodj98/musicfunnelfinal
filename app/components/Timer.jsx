'use client';


import { useEffect, useState } from "react"

//This component is like the clock (It counts down every second) that SessionManager watches for. Basically, SessionManagner the parent is saying "hey go do this for me and let me know when its done do I can do what i need". 


//It starts with a set time (e.g., 3600 seconds) which came from the parent prop.
//Every second, it decreases the time and tells the SessionManager, “Hey, there are now X seconds left.”

//When it reaches 60 seconds, it calls a special function (called onWarning) so the SessionManager knows it’s time to show the popup.
//If the time runs out completely, it calls another function (called onExpire) so the SessionManager can, for example, log the user out or send them back to the squeeze page.

//This defines a functional component called Timer accepts 4 props
//initialTime: The starting value for the timer (typically in seconds).
//onExpire: A callback function to be called when the timer reaches zero.
//The onWarning callback will be called once count down reaches 60 secs

const Timer = ({initialTime, onTimeUpdate, onWarning, onExpire }) => {

    const [timeLeft, setTimeLeft] = useState(initialTime); //Here, timeLeft is a state variable initialized to the value of initialTime.

    useEffect(() => {
        // Call the onTimeUpdate callback so the parent knows the current time
        onTimeUpdate && onTimeUpdate(timeLeft);
        
        //If Timer runs out of time, then Timer lets SessionManager know by calling the onExpire function that SessionManager told Timer how to tell it. That way SessionManager can handle what it needs to do, like redirecting and showing some alert of notification.
        if (timeLeft <= 0) { //	This condition checks whether the timer has run out.
            onExpire && onExpire();
            return; //This stops further execution in the effect if the timer has expired.
        }
        // Trigger onWarning when timeLeft reaches exactly 60 seconds. So when the time that SessionManager told Timer to keep track of is 60. Timer is supposed to let SessionManager know that "hey i have 60 secs left". The way it does this is by passing the time that is left to the onWarning function that came from the SessionManager.
        if (timeLeft === 60) {
            onWarning && onWarning(timeLeft);
        }
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000) //This interval function runs every second. Every second that passes, 1 is taken away

        return () => clearInterval(timerId);
    }, [timeLeft,onTimeUpdate, onWarning, onExpire]);
  
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
  
    return (
    <div>
        <p>Time remaining:{minutes}:{seconds.toString().padStart(2, "0")}</p>
    </div>
  )
}

export default Timer;
