'use client';
import { useEffect, useState, useRef } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { useWebSocket } from "../utils/websocket";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const StripeForm = () => {

const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
//using useRef, ensure that this value is preserved across component re-renders but does not cause any re-renders when it changes. Good for timers, sunscriptions, etc
const heartbeatInterval = useRef(null);
const [sessionToken, setSessionToken] = useState(null);
//This is a customized hook called useWebSocket. It returns the send function and the current status immediately because this hook manages it own state.
const {send, status} = useWebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKETURL}`);
// Function to get CSRF token from cookies
const getCsrfToken = () => {
    const value = `; ${document.cookie}`; // all subsequent cookies will be preceded by ;
    const parts = value.split(`; csrfToken=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
};
useEffect(() => {
    // Add event listener for before unload. Using the beforeunload event to warn users if they are about to leave during an active session. This doesn’t prevent them from leaving but can reduce accidental closures.
    const handleBeforeUnload = (event) => {
        if (loading) {
            const message = 'You have an ongoing transaction. Are you sure you want to leave?';
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
        if (status === 'connected') {
            // Use `send` to initiate actions, like notifying server of client actions
            send({ 
                action: 'checkoutAborted', 
                sessionToken: sessionToken
            });
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    //Defining the heartbet function to let us know session is alive
    const sendHeartbeat = () => {
        if (status === 'connected') {
            send({
                action: 'heartbeat', 
                sessionToken: sessionToken, // use the latest session token
                message: 'Keep session alive'
            });
        }
    };
    heartbeatInterval.current = setInterval(sendHeartbeat, 30000); //Send heartbeat every 30 seconds
    return () => {
    // Clean up WebSocket and unload event listener on unmount
        clearInterval(heartbeatInterval.current);
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
}, [sessionToken, status, send]); // Rerun effect when sessionToken changes

//This handles the checkout session creation
const handleCheckout = async () => {
    setLoading(true);
    setError('');
    const csrfToken = getCsrfToken(); //Get CSRF from cookies
    try {
        //call the backend to create checkout session
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken, //Include CSRF token in request headers
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not Ok.');
        }

        const session = await response.json();
        setSessionToken(session.sessionToken); // Store session token so the sendHeartbeat and handleBeforeUnload functions can have access to the same sessionToken. So it can process on its' end.
      
       // Send WebSocket message: Checkout Initiated and its sessionToken to the websocket client, that's already checking if there is a connection. 
       
        if (session.id) {
            if (status === 'connected') {
                send({ action: 'checkoutInitiated', sessionToken: session.sessionToken});
            }
            //redirect user to Stripe checkout page
            const stripe = await stripePromise; //instance once the library is fully loaded and ready to interact with
            const result = await stripe.redirectToCheckout({ sessionId: session.id });
            //Even though a session ID is successfully created, there are scenarios where the redirection might fail: network interruptions, browser restrictions, or conflicts in JavaScript execution that might prevent the redirection from occurring as expected.
            if (result.error) {
                send({ action: 'checkoutFailed', sessionToken: session.sessionToken });
                throw result.error;
            } 
        }
        } catch (error) {
            console.error('Error during checkout:', error);
            setError('Failed to redirect to checkout. Please try again.');
            setLoading(false);  
            // Send WebSocket message: Checkout Failed
                
        } finally {
            setLoading(false);
        }
         // Display connection status
        useEffect(() => {
            if (status === 'disconnected') {
                setError('WebSocket connection lost. Please check your network.');
            }
        }, [status]);
    };

  return (
    <div className="border-2 p-10 flex">
        <section className="flex flex-col">
            <div>
                <p>price</p>
            </div>
            <button className="bg-white" disabled={loading}  onClick={handleCheckout}>
                {loading ? 'Redirecting to Checkout...' : 'Buy Fan Pack'}
            </button>
        </section>
       
        {error && <p style={{color: 'red' }}>{error}</p>}
    </div>
  )
}

export default StripeForm;
