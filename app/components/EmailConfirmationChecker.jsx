import { useState, useEffect } from "react";
import useSubscriptionState from "../hooks/useSubscriptionState";

const EmailConfirmationChecker = ({ email, rememberMe, onConfirmed }) => {
  const [status, setStatus] = useState("waiting");
  const [error, setError] = useState("");
  const { saveSubscription } = useSubscriptionState();

  useEffect(() => {
    // Poll every 10 seconds
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch("/api/check-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, rememberMe })
        });
        if (response.ok) {
            console.log('Response went through');
            
          const data = await response.json();
          // Assume data includes sessionToken, csrfToken etc.
          if (data.sessionToken) {
            // Stop polling and redirect or update UI accordingly
            if (onConfirmed) {
              onConfirmed();
            }
            saveSubscription({ status: "subscribed"});
            clearInterval(intervalId);
            // Redirect to /landing page or update application state
            setTimeout(() => {
              window.location.href = "/landing";
            }, 10500);
          }
        } else {
          console.error("Check status not ready yet.");
        }
      } catch (err) {
        console.error("Polling error:", err);
        setError("An error occurred. Please try again later.");
        clearInterval(intervalId);
      }
    }, 10000); // 10-second interval

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [email, rememberMe, onConfirmed, saveSubscription]);

  return (
    <div>
      {status === "waiting" && 
      <div className="">
        <p className="tw-text-lighterblue tw-font-header">Please check your email and confirm subscription. Don't see it? Check Spam folder!</p> 
        <p className="tw-text-lighterblue tw-font-header">Once confirmed, please return to this page!</p> 
      </div>
      }
    </div>
  );
};

export default EmailConfirmationChecker;