"use client";

import { useCallback, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import Modal from "./ui/modal";
import BrandButton from "./ui/BrandButton";
import CircularProgress from "@mui/material/CircularProgress";
import TextInput from "./ui/TextInput";
import GroupIcon from "@mui/icons-material/Group";
import FindMe from "./FindMe";
import SnackbarComponent from "./ui/snackbar";
import { useRouter } from "next/navigation";
import CheckIcon from "@mui/icons-material/Check";
import { validationSchema } from "../utils/inputValidation";
import z from "zod/v4";
import { User, ErrorMessage } from "../types/types";
import { Severity } from "../types/types";

const SubscriptionForm = () => {
  const router = useRouter();

  const [user, setUser] = useState<User>({
    name: "",
    email: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<ErrorMessage[] | ErrorMessage>([]);
  const [status, setStatus] = useState("idle");
  const [lgShow, setLgShow] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });
  const [notifierSeverity, setNotifierSeverity] = useState<Severity>();

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        validationSchema.parse(user);

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
            setSnackbar({
              open: true,
              message:
                "You already have an active session! Redirecting you to the landing page..",
            });
            setNotifierSeverity("info");
            setStatus("idle");
            setTimeout(() => {
              router.push("/landing");
            }, 3000);
            return;
          }
          if (errorResponse.error.includes("inconsistent state")) {
            setSnackbar({
              open: true,
              message:
                "Your session data is in an inconsistent state. Redirecting you to the homepage to start fresh..",
            });
            setNotifierSeverity("warning");
            setStatus("idle");
            setTimeout(() => {
              router.push("/");
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
          const errorMessage =
            errorResponse.error || "Something went wrong, please try again!";
          const isNameError = errorMessage.includes("Invalid name");
          const isEmailError = errorMessage.includes("Invalid email");
          const fieldErrorType = isNameError
            ? "Name"
            : isEmailError
              ? "Email"
              : "Unknown";
          const fieldError: ErrorMessage = {
            field: `InternalErrorServer${fieldErrorType}`,
            message: errorMessage,
          };
          setErrors(fieldError);
          setNotifierSeverity("error");
          setStatus("error");
          return;
        }
      } catch (error) {
        console.error("Subscription error:", error);

        if (error instanceof z.ZodError) {
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
    },
    [user, router],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === "name") {
      setUser((prevUser) => ({ ...prevUser, name: value }));
    } else if (name === "email") {
      setUser((prevUser) => ({ ...prevUser, email: value }));
    }
  };

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
              {errors &&
                !Array.isArray(errors) &&
                errors.field === "InternalErrorServerUnknown" && (
                  <p className="text-sm text-red-500">{errors.message}</p>
                )}
              {Array.isArray(errors) &&
                errors
                  .filter((error) => error.field === "name")
                  .map((error, index) => (
                    <p key={index} className="text-sm text-red-500">
                      {error.message}
                    </p>
                  ))}
              {errors && !Array.isArray(errors) && errors.field === "name" && (
                <p className="text-sm text-red-500">{errors.message}</p>
              )}
              {errors &&
                !Array.isArray(errors) &&
                errors.field === "InternalErrorServerName" && (
                  <p className="text-sm text-red-500">{errors.message}</p>
                )}

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
              {errors &&
                !Array.isArray(errors) &&
                errors.field === "InternalErrorServerEmail" && (
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
        </div>
      </Modal>
      <SnackbarComponent
        message={snackbar.message}
        severity={notifierSeverity}
        open={snackbar.open}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default SubscriptionForm;
