'use client';

import React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation';
import useSubscriptionState from '../hooks/useSubscriptionState';

const Redirect = () => {
    const { subscription } = useSubscriptionState();
    const router = useRouter();


    useEffect(() => {
        if (subscription && subscription.status === "subscribed") {
            window.location.href = "/landing";
        }
    },[subscription]);


  return (
    <>
      
    </>
  )
}

export default Redirect
