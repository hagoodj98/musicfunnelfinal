'use client';


import { useEffect, useState } from "react"

//This defines a functional component called Timer accepts two props
//initialTime: The starting value for the timer (typically in seconds).
//onExpire: A callback function to be called when the timer reaches zero.

const Timer = ({initialTime, onExpire }) => {

    const [timeLeft, setTimeLeft] = useState(initialTime); //Here, timeLeft is a state variable initialized to the value of initialTime.

    useEffect(() => {
        if (timeLeft <= 0) { //	This condition checks whether the timer has run out.
            onExpire && onExpire();
            return; //This stops further execution in the effect if the timer has expired.
        }
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000) //This interval function runs every second. Every second that passes, 1 is taken away
        return () => clearInterval(timerId);
    }, [timeLeft, onExpire]);
  
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
  
    return (
    <div>
        <p>Time remaining:{minutes}:{seconds.toString().padStart(2, "0")}</p>
    </div>
  )
}

export default Timer;
