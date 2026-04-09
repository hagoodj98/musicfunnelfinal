"use client";

import { useEffect, useState } from "react";
import { useSessionTimeContext } from "../context/EmailContext";
import SessionManager from "./SessionManager";
import { useRouter } from "next/navigation";
const SessionManagerProvider = () => {
  const { sessionTime } = useSessionTimeContext(); //context is strictly for setting session time from confirmation page. SessionManagerProvider is responsible for fetching the initial session time from the server and passing it to SessionManager. Once the session time is set in the context, SessionManager will use it to manage the session timer. If the session time is updated (e.g., after refreshing the session), SessionManager will receive the new value through props and update accordingly.
  const [timeRemaining, setTimeRemaining] = useState(0);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTTL = async () => {
      if (sessionTime) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/session-info");
        if (!res.ok) {
          throw new Error("Failed to retrieve session information");
        }
        //Get the ttl from the response json which has the ttl property attached to it.
        const data = await res.json();

        //Set the current cookie time remaining to initialTime
        setTimeRemaining(data.ttl);
      } catch (error) {
        console.error(error);
        // Handle errors as needed (e.g., redirect to login)
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchTTL();
  }, [router, sessionTime]);

  //you need some kind of loading state when user is redirected to /landing.
  if (!sessionTime) {
    if (loading) {
      return <p className="text-white">Loading session time…</p>;
    }
  }
  return (
    <div>
      <SessionManager
        //If sessionTime is not 0, use it. Otherwise, fall back to timeRemaining which was fetched from the server. This ensures that if the session was refreshed and sessionTime was updated, we use the new sessionTime. If sessionTime is still 0 (e.g., on initial load before fetching), we use the timeRemaining from the server.
        initialTime={sessionTime !== 0 ? sessionTime : timeRemaining}
      />
    </div>
  );
};

export default SessionManagerProvider;
