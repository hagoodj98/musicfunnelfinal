'use client';

import { useEffect, useState } from "react";
export function useEmailPolling(email, rememberMe, shouldPoll) {

    const [status, setStatus] = useState('waiting'); 
    const [error, setError] = useState(null);
  

    useEffect(() => {
        if (!shouldPoll || !email) return;
         
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

                if (data.sessionToken) {
                  setStatus('confirmed');
                  console.log('Subscription confirmed. Redirecting...');
                  
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

    let intervalId = setInterval(async () => {
        const stopPolling = await pollCheckStatus();
        if (stopPolling) {
            clearInterval(intervalId);
        }
        }, 10000);

  // Cleanup interval on unmount or if email/rememberMe/shouldPoll changes
  return () => clearInterval(intervalId);
    }, [email, rememberMe, shouldPoll]);
    return { status, error};
}