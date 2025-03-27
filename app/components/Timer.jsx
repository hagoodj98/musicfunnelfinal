'use client';
import { useEffect, useState } from "react";

const Timer = ({initialTime, onTimeUpdate, onWarning, onExpire }) => {

    const [timeLeft, setTimeLeft] = useState(initialTime); //Here, timeLeft is a state variable initialized to the value of initialTime.

    useEffect(() => {
    
        onTimeUpdate(timeLeft);
        
        if (timeLeft <= 0) { 
            onExpire();
            return; //This stops further execution in the effect if the timer has expired.
        }
  
        if (timeLeft === 60) {
            onWarning(timeLeft);
        }
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000) //This interval function runs every second. Every second that passes, 1 is taken away

        return () => clearInterval(timerId);
    }, [timeLeft, onTimeUpdate, onWarning, onExpire]); 

    const minutes = Math.floor(timeLeft / 60);

    const seconds = timeLeft % 60;
  
    return (
        <div>
            <p className="tw-hidden">Time remaining:{minutes}:{seconds.toString().padStart(2, "0")}</p>
        </div>
  )
}

export default Timer;
