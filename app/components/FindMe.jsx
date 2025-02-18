'use client';

import { useState } from "react"
import { toast } from "react-toastify";


const FindMe = () => {
    const [email, setEmail] = useState('');
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
                toast.error(data.error || 'Something went wrong. Please try again.');
                return;
            }
            toast.success('Ahh! We found that you are a subscriber. No need to proceed any further. Instead, please check email! 🙂✅');
        } catch (error) {
            console.error('Error checking subscription:', error);
            toast.error('Internal error. Please try again later. 🛑')
        }
    }


  return (
    <div>
      <form onSubmit={handleFindMe}>
        <input type="email" placeholder="Enter your email" required value={email} onChange={e => setEmail(e.target.value)}/>
        <button type="submit">Find Me!</button>
      </form>
    </div>
  )
}

export default FindMe;
