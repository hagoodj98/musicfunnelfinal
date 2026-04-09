"use client";

import { useState } from "react";
import Timer from "./Timer";
import RefreshPopup from "./RefreshPopup";
import { useRouter } from "next/navigation";

const SessionManager = ({ initialTime }: { initialTime: number }) => {
  const router = useRouter();

  const [showPopup, setShowPopup] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const updateTimeLeft = (timeLeft: number) => {
    setTimeLeft(timeLeft);
  };
  const handleWarning = (timeLeft: number) => {
    setShowPopup(true);
    setTimeLeft(timeLeft); // Update state with current time
  };
  const handleExpire = () => {
    // For example, redirect the user or take other actions
    window.confirm(
      "Your session has expired. You will be redirected to the squeeze page.",
    );
    router.push("/");
  };
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <div>
      <Timer
        initialTime={initialTime}
        onTimeUpdate={updateTimeLeft}
        onWarning={handleWarning}
        onExpire={handleExpire}
      />
      {showPopup && (
        <RefreshPopup timeLeft={timeLeft} onClose={handleClosePopup} />
      )}
    </div>
  );
};

export default SessionManager;
