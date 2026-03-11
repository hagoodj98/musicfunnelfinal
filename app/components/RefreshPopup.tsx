"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Modal from "./ui/modal";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

type RefreshPopupProps = {
  timeLeft: number;
  onClose: () => void;
};

const RefreshPopup = ({ timeLeft, onClose }: RefreshPopupProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/refresh-session", {
        method: "POST",
      });
      //I want to make sure the response was made without issues
      if (!response.ok) {
        throw new Error("Failed to create checkout session.");
      }

      const data = await response.json();
      //Hiding popup on success
      onClose();
      setSuccess(data.message);
      //This reloads the whole /landing to use the new session data
      window.location.reload();
      // On successful refresh, hide the popupz
    } catch (err) {
      console.error("Error refreshing session:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Session Will Expire Soon"
      subtitle="Stay connected to keep your place"
      icon={<AccessTimeIcon fontSize="small" />}
    >
      <div className="space-y-2">
        <p className="font-header text-lg">
          Your session will expire in {timeLeft} seconds.
        </p>
        <p className="font-body text-xl">
          Would you like to refresh your session?
        </p>
        <p className="font-body text-lg text-yellow">
          (note) You&apos;ll be redirected back to the home page if you do not
          refresh the session.
        </p>

        {error && <p style={{ color: "#ff8a8a" }}>Error: {error}</p>}
        {success && <p style={{ color: "#a6ffbf" }}>{success}</p>}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button
          onClick={onClose}
          sx={{
            marginRight: "5px",
            backgroundColor: "rgb(1, 10, 38, 0.8)",
            borderColor: "rgb(1, 10, 38, 0.8)",
            color: "white",
            "&:hover": {
              backgroundColor: "#FDEAB6",
              borderColor: "#FDEAB6",
              color: "rgb(1, 10, 38, 0.8)",
            },
          }}
          disabled={loading}
          variant="contained"
        >
          <span className="font-header">Nope!</span>
        </Button>
        <Button
          onClick={handleRefresh}
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: "secondary.main",
            color: "white",
            borderColor: "secondary.main",
            "&:hover": {
              backgroundColor: "#FDEAB6",
              borderColor: "#FDEAB6",
              color: "rgb(1, 10, 38, 0.8)",
            },
          }}
        >
          <span className="font-header">
            {loading ? "Refreshing..." : "Refresh me!"}
          </span>
        </Button>
      </div>
    </Modal>
  );
};

export default RefreshPopup;
