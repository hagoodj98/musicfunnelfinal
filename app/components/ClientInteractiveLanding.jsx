'use client';

import { useState } from "react";
import StripeForm from '../components/StripeForm';
import RememberMe from '../components/RememberMe';
import Timer from '../components/Timer';


const ClientInteractiveLanding = () => {
    const [rememberMeEnabled, setRememberMeEnabled] = useState(true);

    const CHECKOUT_WINDOW = 600; //5 minutes

    const handleTimerExpire = () => {
        alert("Your checkout session has expired. Please check your email for a new purchase link.");
        // Optionally, you might redirect or update the UI here.
        window.location.href = "/landing"; // refresh the landing page
      };

  return (
    <div>
        <Timer initialTime={CHECKOUT_WINDOW} onExpire={handleTimerExpire} />
        <RememberMe onChange={setRememberMeEnabled} />
        <StripeForm rememberMe={rememberMeEnabled} />
    </div>
  )
}

export default ClientInteractiveLanding;
