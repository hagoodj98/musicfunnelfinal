"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [isSubscriptionConfirmed, setIsSubscriptionConfirmed] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/email-confirmation");
        if (!response.ok) {
          console.log("there was a problem");
        }
        setIsSubscriptionConfirmed(true);
        router.push("/landing");
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [router]);

  return (
    <div>
      {" "}
      {isSubscriptionConfirmed
        ? "Subscription Confirmed"
        : "Checking Subscription"}
    </div>
  );
}

//This page is just for testing the email confirmation endpoint. I want to make sure that when the user confirms their email, the GET request to this endpoint works and redirects the user to /landing. So I have this useEffect that makes a request to the email-confirmation endpoint. If everything works, then when I click the confirmation link in the email, I should see the data from that endpoint in the console and get redirected to /landing. If there is an error, then I will see that error in the console instead.
