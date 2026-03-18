"use client";

import { useState, useEffect } from "react";
import Checkbox from "@mui/material/Checkbox";
import Modal from "./ui/modal";
import BrandButton from "./ui/BrandButton";
import CircularProgress from "@mui/material/CircularProgress";
import TextInput from "./ui/TextInput";
import GroupIcon from "@mui/icons-material/Group";
//import { useEmailContext } from "../context/EmailContext";
import FindMe from "./FindMe";
import { useRouter } from "next/navigation";
import CheckIcon from "@mui/icons-material/Check";
import { toast } from "react-toastify";
import { validationSchema } from "../utils/zodValidation";
import z from "zod/v4";
import { User, ErrorMessage } from "../types/types";

const SubscriptionForm = () => {
  const router = useRouter();
  //const { email, setEmail, rememberMe, setRememberMe, setShouldPoll } useEmailContext();

  const [user, setUser] = useState<User>({
    name: "",
    email: "",
    rememberMe: undefined,
  });
  const [errors, setErrors] = useState<ErrorMessage[] | ErrorMessage>([]);
  const [status, setStatus] = useState("idle");
  const [lgShow, setLgShow] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      validationSchema.parse(user);
      console.log(user);

      setStatus("pending");
      setErrors([]);
      const subscribeResponse = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      if (!subscribeResponse.ok) {
        const errorResponse = await subscribeResponse.json();

        if (errorResponse.error.includes("active session")) {
          toast.info("You already have an active session. Redirecting...");
          setStatus("idle");
          setTimeout(() => {
            router.push("/landing");
          }, 3000);
          return;
        }

        if (errorResponse.error.includes("already subscribed")) {
          const errorMessage = "Email already subscribed!";
          const fieldError: ErrorMessage = {
            field: "email",
            message: errorMessage,
          };
          setErrors(fieldError);
          setStatus("error");
          return;
        }

        setErrors(
          errorResponse.error || "Something went wrong, please try again!",
        );
        setStatus("error");
        return;
      }
    } catch (error) {
      console.error("Subscription error:", error);

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

      setStatus("error");
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    console.log(name);

    if (name === "name") {
      setUser((prevUser) => ({ ...prevUser, name: value }));
    } else if (name === "email") {
      setUser((prevUser) => ({ ...prevUser, email: value }));
    }
  };

  useEffect(() => {
    if (status === "confirmed") {
      toast.success(
        "Thank you for subscribing! Redirecting you the landing page..",
      );
    }
  }, [status]);

  return (
    <div className="flex w-full justify-center">
      <BrandButton
        tone="ghost"
        onClick={() => setLgShow(true)}
        variant="contained"
        sx={{ width: "fit-content", minWidth: 210, marginX: "auto", px: 3 }}
      >
        <span className="font-header">Join The Family!</span>
      </BrandButton>
      <Modal
        open={lgShow}
        onClose={() => setLgShow(false)}
        title="Join The Family"
        subtitle="Enter your name and email below to unlock the free fan bundle."
        icon={<GroupIcon fontSize="small" />}
        maxWidthClass="max-w-xl"
      >
        <div>
          {(status === "idle" ||
            status === "error" ||
            status === "pending" ||
            status === "confirmed") && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <p className="text-center text-sm leading-relaxed text-yellow/90 sm:text-base">
                Use your best email so we can send your access right away.
              </p>
              {Array.isArray(errors) &&
                errors
                  .filter((error) => error.field === "name")
                  .map((error, index) => (
                    <p key={index} className="text-sm text-red-500">
                      {error.message}
                    </p>
                  ))}

              <TextInput
                label="Your Name"
                value={user.name}
                name="name"
                onChange={handleChange}
                iconType="account"
              />
              {Array.isArray(errors) &&
                errors
                  .filter((error) => error.field === "email")
                  .map((error, index) => (
                    <p key={index} className="text-sm text-red-500">
                      {error.message}
                    </p>
                  ))}
              {errors && !Array.isArray(errors) && errors.field === "email" && (
                <p className="text-sm text-red-500">{errors.message}</p>
              )}
              <TextInput
                label="Email"
                value={user.email}
                name="email"
                onChange={handleChange}
                iconType="email"
              />

              {Array.isArray(errors) &&
                errors
                  .filter((error) => error.field === "rememberMe")
                  .map((error, index) => (
                    <p key={index} className="text-sm text-red-500">
                      {error.message}
                    </p>
                  ))}
              <label className="w-fit text-base text-yellow/95">
                <Checkbox
                  onChange={(e) =>
                    setUser((prevUser) => ({
                      ...prevUser,
                      rememberMe: e.target.checked,
                    }))
                  }
                  sx={{
                    color: "rgba(253, 234, 182, 0.82)",
                    "&.Mui-checked": {
                      color: "#EF4C12",
                    },
                  }}
                />
                Remember Me
              </label>

              <div className="flex justify-center">
                <BrandButton
                  disabled={status === "pending"}
                  variant="outlined"
                  className="mx-auto"
                  type="submit"
                >
                  <span className="font-header inline-flex items-center">
                    {status === "pending" ? (
                      <>
                        <CircularProgress
                          size="20px"
                          style={{
                            display: "inline-flex",
                            verticalAlign: "middle",
                          }}
                          color="inherit"
                        />
                        <span className="font-header ml-2">
                          Pending Subscription...
                        </span>
                      </>
                    ) : status === "confirmed" ? (
                      <CheckIcon />
                    ) : (
                      "Get Instant Access"
                    )}
                  </span>
                </BrandButton>
              </div>

              <div className="flex justify-center">
                <FindMe />
              </div>
            </form>
          )}
          {status === "confirmed" && (
            <p className="text-center text-yellow">
              Subscription confirmed! Redirecting to the landing page...
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionForm;
