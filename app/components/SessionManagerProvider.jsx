'use client'

import { useEffect, useState } from 'react';
 
import SessionManager from './SessionManager';


const SessionManagerProvider = () => {

const [initialTime, setInitialTime] = useState(null) //default
//you need some kind of loading state when user is redirected to /landing.
const [loading, setLoading] = useState(true);

useEffect(() => {
 
  const fetchTTL = async () => {
    try {
      const res = await fetch('/api/session-info');
      if (!res.ok) {
        throw new Error('Failed to retrieve session information');
      }
      //Get the ttl from the response json which has the ttl property attached to it.
      const data = await res.json();
      
      //Set the current cookie time remaining to initialTime
      setInitialTime(data.ttl); 
    } catch (error) {
      console.error(error);
      // Handle errors as needed (e.g., redirect to login)
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };
  fetchTTL();

},[]);

//this block of code is running in between pages
if (loading) {
  return <p className='tw-text-white'>Loading Session time...</p>
}

  return (
    <div>
        <SessionManager initialTime={initialTime}/>
    </div>
  )
}

export default SessionManagerProvider;
