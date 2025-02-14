'use client'

import { useEffect, useState } from 'react';
import SessionManager from './SessionManager';

const SessionManagerProvider = () => {
//unless updated, initialTime will start at 3600 seconds. This state updates by allowing this server component to make a GET request because we want the current value to the cookies that were just issued.
const [initialTime, setInitialTime]= useState(null) //default
const [loading, setLoading]= useState(true);

//we are using useEffect because as soon as this server component loads after the subscriber confirmed email, we want to make a GET request to get the current TTL from the sessionToken cookie and set it equal to the initialTime. We then use the initialTime and send it through the initialTime prop. 	SessionManager uses this value to start its Timer. 
useEffect(() => {
  // Call the session-info endpoint to get the TTL by setting all this to a variable called fetchTTL which is a function.
  const fetchTTL = async () => {
    try {
      const res = await fetch('/api/session-info');
      if (!res.ok) {
        throw new Error('Failed to retrieve session information');
      }
      //Get the ttl from the response json
      const data = await res.json();
      //Set the current cookie time remaining to initialTime
      setInitialTime(data.ttl);
    } catch (error) {
      //If this catch block runs then that means something happened in the session-info api. Inside the API, all we are doing to getting the existing cookies, particularly, the sessionToken cookie and using it to get the key, it is associated with via redis. If that process does not go through there has to be a internal error somewhere.
      console.error(error);
      // Handle errors as needed (e.g., redirect to login)
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };
//We set the fetchTTL function above, now when the page loads, we just call the function
fetchTTL();

},[]);

if (loading) {
  return <p>Loading Session time...</p>
}

 // Pass the fetched TTL value to the SessionManager.
  return (
    <div>
        <SessionManager initialTime={initialTime}/>
    </div>
  )
}

export default SessionManagerProvider;
