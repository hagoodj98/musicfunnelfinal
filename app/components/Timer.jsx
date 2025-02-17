'use client';


import { useEffect, useState } from "react"

//This component is like the clock (It counts down every second) that SessionManager watches for. Basically, SessionManagner the parent is saying "hey go do this for me and let me know when its done do I can do what i need". 


//It starts with a set time whatever initialTime is setup in /check-status which came from the parent prop.
//Every second, it decreases the time tells the SessionManager, “Hey, there are now X seconds left.”

//When it reaches 60 seconds, it calls a special function (called onWarning) so the SessionManager knows it’s time to show the popup.
//If the time runs out completely, it calls another function (called onExpire) so the SessionManager can, for example, log the user out or send them back to the squeeze page.

//This defines a functional component called Timer accepts 4 props
//initialTime: The starting value for the timer (typically in seconds).
//onTimeUpdate: This is the eyes of the parent component SessionManager keeping track of it child
//onExpire: A callback function to be called when the timer reaches zero.
//The onWarning callback will be called once count down reaches 60 secs
//The reason why these 4 functions are all going to the parent SessionManager is because SessionManager is simply the parent. Everything should go back to the parent.

const Timer = ({initialTime, onTimeUpdate, onWarning, onExpire }) => {

    const [timeLeft, setTimeLeft] = useState(initialTime); //Here, timeLeft is a state variable initialized to the value of initialTime.

    useEffect(() => {
        //If onTimeUpdate (or onWarning, onExpire) is not provided (i.e., it’s undefined or null), trying to call it directly with onTimeUpdate(timeLeft) would result in an error. The && operator checks first if onTimeUpdate is truthy (i.e., exists) and only then calls it. 
        //conditional check makes the component more robust and flexible.

        // Call the onTimeUpdate callback so the parent knows the current time. .
        onTimeUpdate(timeLeft);
        
        //If Timer runs out of time, then Timer lets SessionManager know by calling the onExpire function that SessionManager told Timer how to communicate with it. That way SessionManager can handle what it needs to do, like redirecting and showing some alert of notification.
        if (timeLeft <= 0) { //	This condition checks whether the timer has run out. Then check is this prop exists first, then call the function
            onExpire();
            return; //This stops further execution in the effect if the timer has expired.
        }
        // Trigger onWarning when timeLeft reaches exactly 60 seconds. So when the time that SessionManager told Timer to keep track of is 60. Timer is supposed to let SessionManager know that "hey i have 60 secs left". The way it does this is by passing the time that is left to the onWarning function that came from the SessionManager as a prop. 
        if (timeLeft === 60) {
            onWarning(timeLeft);
        }
        // This timerId is actually the timer. Inside it a function executes every second. timeLeft is currently set to initialTime. But this setInterval updates the timeLeft by subtracting 1 every second.
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000) //This interval function runs every second. Every second that passes, 1 is taken away

        return () => clearInterval(timerId);
    }, [timeLeft, onTimeUpdate, onWarning, onExpire]); //whenever any of these values change—whether it’s the current time (timeLeft) or one of the functions passed as props—the effect runs again. 
  
  //timeLeft is the total number of seconds remaining.
  //Math.floor(timeLeft / 60) divides the total seconds by 60 (because there are 60 seconds in a minute) and rounds down to the nearest whole number.
  //this gives ME the number of full minutes left.
    const minutes = Math.floor(timeLeft / 60);
    //timeLeft % 60 uses the remainder operator (%) to find out how many seconds remain after dividing by 60. This gives me the leftover seconds that don’t add up to a full minute.
    const seconds = timeLeft % 60;
  
    return (
        <div>
            {/* The .padStart(2,"0") ensures that this string is at least 2 characters long by adding a “0” at the beginning if necessary. For example, if seconds is 5, it turns “5” into “05”. This is a format of time everyone is used to seeing  */}
            <p>Time remaining:{minutes}:{seconds.toString().padStart(2, "0")}</p>
        </div>
  )
}

export default Timer;
