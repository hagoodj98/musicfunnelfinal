'use client';


import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSubscriptionState from '../hooks/useSubscriptionState';
import { EmailContext } from '../context/EmailContext';
import { toast } from 'react-toastify';


const Redirect = () => {
    
    // grab the hook return first
    const { subscription, saveSubscription } = useSubscriptionState();
    const { rememberMe } = useContext(EmailContext);

    // if subscription is ever null/undefined, fall back to an empty object
    const safeSub = subscription || {};
    const status = safeSub.status;
    const pollEmail = safeSub.email;
    const router = useRouter();

   
        // 1) If we already know they're subscribed, send them straight to /landing
+  useEffect(() => {
        if (status === 'subscribed') {
          router.replace('/landing');
        }
      }, [status, router]);
    
      // 2) Otherwise, if they're still pending, start polling
      useEffect(() => {
        if (status !== 'pending' || !pollEmail) return;
    
        const interval = setInterval(async () => {
          try {
            const res = await fetch('/api/check-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: pollEmail, rememberMe }),
            });
    
            if (res.ok) {
              const data = await res.json();
              if (data.sessionToken) {
                saveSubscription({ status: 'subscribed', email: pollEmail });
                clearInterval(interval);
                router.replace('/landing');
              }
            }
          } catch (err) {
            console.error('Polling error', err);
          }
        }, 10000);
    
        return () => clearInterval(interval);
      }, [status, pollEmail, rememberMe, saveSubscription, router]);
    
    return null;
}

export default Redirect;