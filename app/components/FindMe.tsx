"use client";

import { useCallback, useState } from "react";
import MessageNotify from "./MessageNotify";
import Modal from "./ui/modal";
import BrandButton from "./ui/BrandButton";
import SearchIcon from "@mui/icons-material/Search";
import TextInput from "./ui/TextInput";
import CircularProgress from "@mui/material/CircularProgress";
import { ErrorMessage } from "../types/types";
import z from "zod/v4";
import { validationSchema } from "../utils/zodValidation";

const FindMe = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); // This will hold the actual message text
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [smShow, setSmShow] = useState(false);
  const [errors, setErrors] = useState<ErrorMessage[]>([]);
  const [status, setStatus] = useState("idle");

  const handleFindMe = useCallback(
    async (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setLoading(true);

      try {
        validationSchema.pick({ email: true }).parse({ email }); // Validate only the email field for this form

        const res = await fetch("/api/check-subscriber", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const errorResponse = await res.json();
          setErrors(
            errorResponse.error || "Something went wrong, please try again!",
          );
          setStatus("error");
          return;
        }
        const data = await res.json();
        // Set the message state to the success message and show toast
        setMessage(`${data.message}#${Date.now()}`);
        setMessageType("success");
        setLoading(false);

        window.location.href = "/landing";
      } catch (error) {
        console.error("Error checking subscription:", error);

        if (error instanceof z.ZodError) {
          console.log("Zod issues:", error.issues);
          const fieldError: ErrorMessage[] = error.issues.map((issue) => ({
            field: issue.path[0] as string,
            message: issue.message,
          }));
          setErrors(fieldError);
          setStatus("error");

          return;
        }
      } finally {
        setLoading(false);
      }
    },
    [email],
  );

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
        {status === "error" &&
          Array.isArray(errors) &&
          errors
            .filter((error) => error.field && error.message)
            .map((error, index) => (
              <p key={index} className="text-red-500 text-sm">
                {error.message}
              </p>
            ))}

        <div className="flex flex-col">
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
            type="button"
            onClick={handleFindMe}
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
        </div>
      </Modal>
    </div>
  );
};

export default FindMe;
