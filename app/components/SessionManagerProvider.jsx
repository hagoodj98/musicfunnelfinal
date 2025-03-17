'use client'

import { useEffect, useState } from 'react';
//importing a component inside of a component like this is like a parent telling the child to go do something and comeback when you are done so I can do what I need to do cause I am the provider.  
import SessionManager from './SessionManager';

//SessionManagerProvider is the parent of SessionManager. SessionManager is the child. SessionManagerProvider servers SessionManager

const SessionManagerProvider = () => {
//unless updated, initialTime will start at whatever time set by the ttl in /check-status. In order This state updates by allowing this  component to make a GET request because we want the current value to the cookies that were just issued.
const [initialTime, setInitialTime] = useState(null) //default
//you need some kind of loading state when user is redirected to /landing.
const [loading, setLoading] = useState(true);

//we are using useEffect because as soon as this component loads after the subscriber confirmed email, we want to make a GET request to get the current TTL from the sessionToken cookie and set it equal to the initialTime. We then use the initialTime and send it through the initialTime prop which is what SessionManager is expecting to get and use; SessionManager uses this value to start its Timer. 
useEffect(() => {
  // Call the session-info endpoint to get the TTL by setting all this to a variable called fetchTTL which is a function.
  const fetchTTL = async () => {
    try {
      const res = await fetch('/api/session-info');
      if (!res.ok) {
        throw new Error('Failed to retrieve session information');
      }
      //Get the ttl from the response json which has the ttl property attached to it.
      const data = await res.json();
      
      //Set the current cookie time remaining to initialTime
      setInitialTime(data.ttl); //Once it gets the current time then the complier jumps down to the finally block and well that is to stop the loading state
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

},[]);// This shoudl only run once because all this component is doing is just getting the ttl for SessionManager to use so SessionManagerProvider can get SessionManager along with its Timer and popup and show it on the /landing server component.  

//this block of code is running in between pages
if (loading) {
  return <p className='tw-text-white'>Loading Session time...</p>
}
 // Pass the fetched TTL value to the SessionManager.
  return (
    <div>
      {/*This is giving SessionManager what it needs to function so that it can come back to the parent (SessionManagerProvider) */}
      
        <SessionManager initialTime={initialTime}/>
    </div>
  )
}

export default SessionManagerProvider;
