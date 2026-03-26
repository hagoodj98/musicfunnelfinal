"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionTimeContext } from "../context/EmailContext";
import ContentSection from "../components/ContentSection";
import SnackbarComponent from "../components/ui/snackbar";
import { Severity } from "../types/types";
import BrandButton from "../components/ui/BrandButton";
import CircularProgress from "@mui/material/CircularProgress";
import SubscriptionForm from "../components/SubscriptionForm";
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
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/email-confirmation");
        if (!response.ok) {
          const errorResponse = await response.json();
          if (errorResponse.error.includes("Session not found")) {
            setErrorMessage("Could not verify email confirmation.");
            setShowSubscriptionForm(true);
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
            {showSubscriptionForm ? (
              <>
                <h1
                  className="font-header text-2xl md:text-3xl mb-2 text-red-900"
                  role="alert"
                >
                  {errorMessage}
                </h1>
                <p className="text-base md:text-lg mb-6">
                  Please re-enter your e-mail and try again.
                </p>
                <SubscriptionForm />
              </>
            ) : (
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
              </h1>
            )}
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
