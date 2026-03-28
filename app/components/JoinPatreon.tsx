"use client";

import Button from "@mui/material/Button";
import ForwardIcon from "@mui/icons-material/Forward";
import { useCallback } from "react";

const JoinPatreon = () => {
  const handleRefresh = useCallback(async () => {
    try {
      await fetch("/api/refresh-session", {
        method: "POST",
      });
      //I want to make sure the response was made without issues

      window.location.reload();
    } catch (err) {
      console.error("Error refreshing session:", err);
    } finally {
    }
  }, []);

  return (
    <div className="flex justify-center my-7">
      <Button
        onClick={() => {
          handleRefresh();
          window.open("https://patreon.com/Jaiquez");
        }}
        sx={{
          // Normal (enabled) styles:
          backgroundColor: "secondary.main",
          color: "white",
          borderColor: "secondary.main",
          "&:hover": {
            backgroundColor: "#FDEAB6",
            borderColor: "#FDEAB6",
            color: "rgb(1, 10, 38, 0.8)",
          },

          // Disabled styles:
          "&.Mui-disabled": {
            // For example, a semi-transparent version of your secondary color
            backgroundColor: "rgba(239, 76, 18, 0.6)",
            color: "white",
            borderColor: "rgba(239, 76, 18, 0.6)",
            cursor: "not-allowed",
            opacity: 1, // override default MUI disabled opacity if desired
          },
        }}
        variant="contained"
        type="submit"
      >
        {" "}
        <ForwardIcon />{" "}
        <span className="font-header">Yes! I want to join your patreon.</span>
      </Button>
    </div>
  );
};

export default JoinPatreon;
