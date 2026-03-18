"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSubscriptionState from "../hooks/useSubscriptionState";
import { useEmailContext } from "../context/EmailContext";
import { toast } from "react-toastify";

const Redirect = () => {
  // grab the hook return first
  const { subscription, saveSubscription } = useSubscriptionState();
  const { rememberMe } = useEmailContext();

  // if subscription is ever null/undefined, fall back to an empty object
  const safeSub = subscription || {};
  const status = safeSub.status;
  const pollEmail = safeSub.email;
  const router = useRouter();

  useEffect(() => {
    if (status !== "pending" || !pollEmail) return;
    console.log(status);

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/check-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pollEmail, rememberMe }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.sessionToken) {
            saveSubscription({ status: "subscribed", email: pollEmail });
            clearInterval(interval);
            toast.success(
              "Thank you! Your subscription is confirmed. Redirecting…",
            );
            router.replace("/landing");
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [status, pollEmail, rememberMe, saveSubscription, router]);

  return null;
};

export default Redirect;
