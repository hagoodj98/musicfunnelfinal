'use client';

import { useState } from "react"
import MessageNotify from "./MessageNotify";
import { toast } from "react-toastify";

const FindMe = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');  // This will hold the actual message text
    const [messageType, setMessageType]= useState('');

    const handleFindMe = async (e) => {
        e.preventDefault();
        try {
            const res= await fetch('/api/check-subscriber', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email})
            });
            const data= await res.json();
            if (!res.ok) {
                 // Set the message state to the error message and show toast
                 setMessage(data.message || 'Something went wrong. Please try again.');
                 setMessageType('error');
                 //toast.error(data.message || 'Something went wrong. Please try again.');
                return;
            }
           // Set the message state to the success message and show toast
           setMessage(data.message);
           setMessageType('success');
        } catch (error) {
            console.error('Error checking subscription:', error);
            setMessage('Internal error. Please try again later. 🛑');
            setMessageType('error');
        }
    }


  return (
    <div>
        <MessageNotify notify={message} type={messageType} />
        <form onSubmit={handleFindMe}>
            <input type="email" placeholder="Enter your email" required value={email} onChange={e => setEmail(e.target.value)}/>
            <button type="submit">Find Me!</button>
        </form>
    </div>
  )
}

export default FindMe;
