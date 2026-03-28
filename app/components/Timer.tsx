"use client";
import { useEffect, useState } from "react";

type TimerProps = {
  initialTime: number;
  onTimeUpdate: (timeLeft: number) => void;
  onWarning: (timeLeft: number) => void;
  onExpire: () => void;
};

const Timer = ({
  initialTime,
  onTimeUpdate,
  onWarning,
  onExpire,
}: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime); //Here, timeLeft is a state variable initialized to the value of initialTime.
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    onTimeUpdate(timeLeft);

    if (timeLeft <= 0) {
      onExpire();
      return; //This stops further execution in the effect if the timer has expired.
    }
    //When the timer reaches 60 seconds or less, the onWarning callback is triggered, allowing the parent component to display a warning popup or take other actions as needed.
    if (timeLeft <= 60) {
      onWarning(timeLeft);
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000); //This interval function runs every second. Every second that passes, 1 is taken away

    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUpdate, onWarning, onExpire]);

  return (
    <div>
      <p className="hidden">
        Time remaining:{minutes}:{seconds.toString().padStart(2, "0")}
      </p>
    </div>
  );
};

export default Timer;
