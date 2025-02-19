import { useEffect, useState } from "react";


export function useEmailPolling(email, rememberMe, shouldPoll) {
//status: "waiting" initially, changes to "confirmed" if we find sessionToken, or "error" if a critical error occurs.
    const [status, setStatus] = useState('waiting'); // 'waiting', 'confirmed', or 'error'
//	error: any error message from a failed request.
    const [error, setError] = useState(null);
  

    useEffect(() => {
    // If we shouldn't poll yet, or no email, return early
        if (!shouldPoll || !email) return; //We start by checking if an email is provided. If there’s no email, the hook doesn’t do anything.

        //Define an async function to poll the API. We define an asynchronous function, fetchStatus, that sends a POST request to /api/check-status with the email and rememberMe flag.
        // Define the polling function (async)
    async function pollCheckStatus() {
        try {
          const response = await fetch('/api/check-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, rememberMe }),
          });
  
          if (response.ok) {
            const data = await response.json();
            console.log('Check-status response data:', data);
  
// If pollCheckStatus detects a success (i.e., data.sessionToken) or an unrecoverable error, it returns true. We then clearInterval(intervalId) to stop further polling.
            if (data.sessionToken) {
              setStatus('confirmed');
              console.log('Subscription confirmed. Redirecting...');
              // If detect a confirmed subscription, do window.location.href = '/landing';
              window.location.href = '/landing';
              // Return true so we know to stop polling
              return true;
            } else {
              // 200 OK but no sessionToken => still pending
              console.log('Subscription still pending...');
            }
          } else {
            // If 404 or another error, handle gracefully
            console.log('Check status not ready yet or error code:', response.status);
          }
        } catch (err) {
          console.error('Polling error:', err);
          setError(err.message || 'An error occurred. Please try again later.');
          setStatus('error');
          // Return true => stop polling if we have a critical error
          return true;
        }
        // Return false => keep polling
        return false;
      }
// We set up a setInterval that calls pollCheckStatus() every 10 seconds. No immediate fetch. The first request happens after 10 seconds.
    let intervalId = setInterval(async () => {
        const stopPolling = await pollCheckStatus();
        if (stopPolling) {
            clearInterval(intervalId);
        }
        }, 10000);

  // Cleanup interval on unmount or if email/rememberMe/shouldPoll changes
  return () => clearInterval(intervalId);
    }, [email, rememberMe, shouldPoll]);
    return { status, error};//The hook returns an object with pollingData, error, and loading so that the component using it can display status messages, errors, or a loading spinner.
}