import { useState, useEffect } from "react";
import useSubscriptionState from "../hooks/useSubscriptionState";
import { useRouter } from "next/navigation";

type EmailConfirmationCheckerProps = {
  email: string;
  rememberMe?: boolean;
  onConfirmed?: () => void; // Optional callback when subscription is confirmed
};

const EmailConfirmationChecker = ({
  email,
  rememberMe,
  onConfirmed,
}: EmailConfirmationCheckerProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [status, setStatus] = useState("waiting");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");
  const router = useRouter();
  const { saveSubscription } = useSubscriptionState();

  useEffect(() => {
    // Poll every 10 seconds
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch("/api/check-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, rememberMe }),
        });
        if (response.ok) {
          const data = await response.json();
          // Assume data includes sessionToken, csrfToken etc.
          if (data.sessionToken) {
            // Stop polling and redirect or update UI accordingly
            if (onConfirmed) {
              onConfirmed();
            }
            saveSubscription({ status: "subscribed" });
            clearInterval(intervalId);
            // Redirect to /landing page or update application state
            setTimeout(() => {
              router.push("/landing");
            }, 10500);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
        setError("An error occurred. Please try again later.");
        clearInterval(intervalId);
      }
    }, 10000); // 10-second interval

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [email, rememberMe, onConfirmed, saveSubscription]);

  return (
    <div>
      {status === "waiting" && (
        <div>
          <p className=" font-header">
            Please check your email and confirm subscription. Don&apos;t see it?
            Check Spam folder!
          </p>
          <p className="text-lighterblue font-header">
            Once confirmed, please return to this page!
          </p>
        </div>
      )}
    </div>
  );
};

export default EmailConfirmationChecker;
