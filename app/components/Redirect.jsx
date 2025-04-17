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

    useEffect(() => {
        if (status !== 'pending' || !pollEmail) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/check-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json'},
                    body: JSON.stringify({email: pollEmail, rememberMe }),
                });
                if (res.ok) {
                    const data = await res.json();
                    if(data.sessionToken) {
                        saveSubscription({status: 'subscribed', email: pollEmail});
                        clearInterval(interval);
                        toast.success('Thank you! Your subscription is confirmed. Redirecting…');
                        router.push('/landing');
                    }
                }
            } catch (e) {
                console.error('Polling error', e);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [status, pollEmail, rememberMe, saveSubscription, router]);
    
    return null;
}

export default Redirect;