"use client";

import { useCallback, useState } from "react";
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

  const handleRefresh = useCallback(async () => {
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
      window.location.reload();
    } catch (err) {
      console.error("Error refreshing session:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [onClose]);

  const handleEndSession = useCallback(async () => {
    try {
      const response = await fetch("/api/end-session", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to end session.");
      }
      window.location.href = "/"; // Redirect to home page
      onClose();
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }, [onClose]);

  return (
    <Modal
      open={true}
      onClose={handleRefresh}
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

        {error && <p style={{ color: "#ff8a8a" }}>Error: {error}</p>}
        {success && <p style={{ color: "#a6ffbf" }}>{success}</p>}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button
          onClick={handleEndSession}
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
          <span className="font-header">Back to Home</span>
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
