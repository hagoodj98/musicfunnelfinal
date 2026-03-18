import { useState, useEffect } from "react";

type SubscriptionState = {
  status?: string;
  email?: string | null;
};

export default function useSubscriptionState() {
  const [subscription, setSubscription] = useState<SubscriptionState | null>(
    null,
  );

  //On mount, load subscription data from localStorage (if any)
  /* useEffect(() => {
    try {
    //  const currentSubscriptionStatus = await fetch(`/api/check-status?email=${}`)
      if (storedSubscription) {
        const parsedData = JSON.parse(storedSubscription);
        setSubscription(parsedData);
      }
    } catch (err) {
      console.error("Error reading subscription from localStorage:", err);
    }
  }, []);
  // Save only the necessary fields, e.g., status and sessionToken
  const saveSubscription = (data: SubscriptionState) => {
    try {
      const saveSubscription = await fetch("/")

    } catch (err) {
      console.error("Error saving subscription:", err);
    }
  };
  // Function to clear subscription data from localStorage
  const clearSubscription = () => {
    try {
      localStorage.removeItem("pendingSubscription");
      setSubscription(null);
    } catch (err) {
      console.error("Error clearing subscription from localStorage:", err);
    }
  };
      */
  return { subscription };
}
