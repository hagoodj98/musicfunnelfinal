"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionTimeContext } from "../context/EmailContext";
import ContentSection from "../components/ContentSection";
import SnackbarComponent from "../components/ui/snackbar";
import { Severity } from "../types/types";
import BrandButton from "../components/ui/BrandButton";
import CircularProgress from "@mui/material/CircularProgress";
export default function Page() {
  const router = useRouter();
  const [isSubscriptionConfirmed, setIsSubscriptionConfirmed] = useState(false);
  const { setSessionTime } = useSessionTimeContext();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });
  const [notifierSeverity, setNotifierSeverity] = useState<Severity>();
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/email-confirmation");
        if (!response.ok) {
          const errorResponse = await response.json();
          if (errorResponse.error.includes("Pending data not found")) {
            setErrorMessage("Could not verify email confirmation.");
            router.push("/");

            return;
          }
          // If the user tries to access this endpoint while they already have an active session (indicated by the presence of session cookies), we want to reject the request with a 403 status code and an appropriate error message. This is because the email confirmation process should only be initiated for users who do not have an active session, and allowing users with active sessions to access this endpoint could lead to confusion or potential security issues. By checking for existing session cookies and rejecting the request if they are present, we can ensure that users go through the proper flow for confirming their email subscription without interfering with any active sessions they may have.
          if (
            errorResponse.error.includes("User already has an active session")
          ) {
            router.push("/landing");
            return;
          }

          setErrorMessage("Unauthorized access. Redirecting to homepage.");
          setTimeout(() => {
            router.push("/");
          }, 2000);
          return;
        }

        setSnackbar({ open: true, message: "Email confirmed!" });
        setNotifierSeverity("success");
        setIsSubscriptionConfirmed(true);
        const data = await response.json();
        setSessionTime(data.sessionTTL);
        router.push("/landing");
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    };

    fetchData();
  }, [router, setSessionTime]);

  return (
    <div>
      <ContentSection>
        <div className="flex flex-col justify-center h-80">
          <div>
            <h1 className="font-header text-2xl md:text-3xl mb-4">
              {isSubscriptionConfirmed ? (
                <span>Email Confirmed! Redirecting to landing page...</span>
              ) : (
                <span>
                  Checking Email Confirmation...
                  <CircularProgress
                    size="20px"
                    style={{
                      display: "inline-flex",
                      verticalAlign: "middle",
                    }}
                    color="inherit"
                  />
                </span>
              )}
              {errorMessage && (
                <p className="font-body text-red-500 text-sm mt-2">
                  {errorMessage}
                </p>
              )}
            </h1>
            {isSubscriptionConfirmed && (
              <p className="font-body  md:text-3xl text-lg">
                Not redirected automatically? Please click the button below.
              </p>
            )}
            {isSubscriptionConfirmed && (
              <BrandButton onClick={() => router.push("/landing")}>
                Landing Page
              </BrandButton>
            )}
          </div>
        </div>
      </ContentSection>
      <SnackbarComponent
        message={snackbar.message}
        severity={notifierSeverity}
        open={snackbar.open}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

//This page is just for testing the email confirmation endpoint. I want to make sure that when the user confirms their email, the GET request to this endpoint works and redirects the user to /landing. So I have this useEffect that makes a request to the email-confirmation endpoint. If everything works, then when I click the confirmation link in the email, I should see the data from that endpoint in the console and get redirected to /landing. If there is an error, then I will see that error in the console instead.
