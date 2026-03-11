"use client";

import { useState } from "react";
import MessageNotify from "./MessageNotify";
import Modal from "./ui/modal";
import BrandButton from "./ui/BrandButton";

import SearchIcon from "@mui/icons-material/Search";
import TextInput from "./ui/TextInput";
import CircularProgress from "@mui/material/CircularProgress";

const FindMe = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); // This will hold the actual message text
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [smShow, setSmShow] = useState(false);

  const handleFindMe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/check-subscriber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Set the message state to the error message and show toast
        setMessage(`${data.error || "Something went wrong."}#${Date.now()}`);
        setMessageType("error");
        //toast.error(data.message || 'Something went wrong. Please try again.');
        return;
      }
      // Set the message state to the success message and show toast
      setMessage(`${data.message}#${Date.now()}`);
      setMessageType("success");
      setLoading(false);

      window.location.href = "/landing";
    } catch (error) {
      console.error("Error checking subscription:", error);
      setMessage("Internal error. Please try again later. 🛑");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className=" mx-auto">
      <BrandButton
        tone="ghost"
        onClick={() => setSmShow(true)}
        variant="contained"
      >
        <span className="  font-header">Already Subscribed?</span>
      </BrandButton>
      <MessageNotify notify={message} type={messageType} />
      <Modal
        open={smShow}
        onClose={() => setSmShow(false)}
        title="Find If You Are Subscribed"
        icon={<SearchIcon fontSize="small" />}
      >
        <form className="flex flex-col" onSubmit={handleFindMe}>
          <TextInput
            label="Your Email"
            value={email}
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            iconType="email"
          />

          <br />
          <BrandButton
            disabled={loading}
            sx={{ marginX: "auto", width: "auto" }}
            className="mt-4 mx-auto"
            type="submit"
            variant="outlined"
          >
            <span className="font-header">
              {loading ? (
                <>
                  <CircularProgress
                    size="20px"
                    style={{ display: "inline-flex", verticalAlign: "middle" }}
                    color="inherit"
                  />
                  <span> Checking...</span>
                </>
              ) : (
                "Find Me!"
              )}
            </span>
          </BrandButton>
        </form>
      </Modal>
    </div>
  );
};

export default FindMe;
