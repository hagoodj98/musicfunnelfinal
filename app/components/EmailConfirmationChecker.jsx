import { useState, useEffect } from "react";

const EmailConfirmationChecker = ({ email, rememberMe }) => {
  const [status, setStatus] = useState("waiting");
  const [error, setError] = useState("");


  useEffect(() => {
    console.log("EmailConfirmationChecker mounted with email:", email);
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
            console.log("Check status response", data);
            
            // Stop polling and redirect or update UI accordingly
            setStatus("confirmed");
            clearInterval(intervalId);
            // Redirect to /landing page or update application state
            window.location.href = "/landing";
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
  }, [email]);

  return (
    <div>
      {status === "waiting" && 
      <div className="tw-flex">
        <p className="tw-text-white">Please check your email and confirm subscription. Don't see it? Check Spam!</p> 
      </div>
      
      }
    </div>
  );
};

export default EmailConfirmationChecker;