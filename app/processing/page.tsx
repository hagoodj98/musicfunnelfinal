"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useSessionTimeContext } from "../context/EmailContext";
import ContentSection from "../components/ContentSection";
import BrandButton from "../components/ui/BrandButton";
import CircularProgress from "@mui/material/CircularProgress";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubscriptionConfirmed, setIsSubscriptionConfirmed] = useState(false);
  const { setSessionTime } = useSessionTimeContext();
  const [errorMessage, setErrorMessage] = useState("");
  const [isCheckoutRedirect, setIsCheckoutRedirect] = useState(false);
  const [isMailchimpRedirect, setIsMailchimpRedirect] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionID = searchParams.get("session_id");
        const params = sessionID ? `?session_id=${sessionID}` : "";
        if (sessionID) {
          setIsCheckoutRedirect(true);
        } else {
          setIsMailchimpRedirect(true);
        }
        //If sessionid does not exist, it means the user confirmed email through mailchimp or manually entered url. Either way, we check for existing info in redis and if not found, we reject the request. This is to prevent unauthorized access to the email confirmation endpoint and ensure that only users who have gone through the proper flow can confirm their email and get redirected to the landing page. If sessionid does exist we check with stripe to verify that the session is paid and then update the session data and mailchimp data accordingly before redirecting to the thank you page. We want to do this verification step to ensure that only users who have completed the checkout process can access the thank you page and have their session and mailchimp data updated, which is important for maintaining the integrity of our subscription flow and providing a seamless user experience. If we did not perform this verification step, it could lead to situations where users who have not completed the checkout process are able to access the thank you page and have their session and mailchimp data updated, which could cause confusion and potential issues with our subscription management.

        const response = await fetch(`/api/processing-webhook${params}`);
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
        const data = await response.json();
        setIsSubscriptionConfirmed(true);

        setSessionTime(data.sessionTTL);
        // If there is a redirectUrl in the response, it means the email confirmation and/or checkout session verification was successful and we can safely redirect the user to the appropriate page (either /landing or /landing/thankyou) based on the flow they came from. We use a timeout to allow the user to see the success message in the snackbar before being redirected, which provides a better user experience by giving them feedback that their action was successful before navigating them to the next page.
        if (data.redirectUrl) {
          setTimeout(() => {
            router.push(data.redirectUrl);
          }, 5000);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    };

    fetchData();
  }, [router, searchParams, setSessionTime]);

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <ContentSection>
          <div className="flex flex-col justify-center h-80">
            <div>
              <h1 className="font-header text-2xl md:text-3xl mb-4">
                {isCheckoutRedirect && (
                  <span>
                    {isSubscriptionConfirmed
                      ? "Purchase confirmed! Redirecting..."
                      : "Processing your purchase confirmation..."}
                    <CircularProgress
                      size="20px"
                      style={{
                        display: "inline-flex",
                        verticalAlign: "middle",
                      }}
                      color="inherit"
                    />{" "}
                  </span>
                )}
                <br />
                {isMailchimpRedirect && (
                  <span>
                    {isSubscriptionConfirmed
                      ? "Email subscription confirmed! Redirecting..."
                      : "Processing your email confirmation..."}
                    <CircularProgress
                      size="20px"
                      style={{
                        display: "inline-flex",
                        verticalAlign: "middle",
                      }}
                      color="inherit"
                    />{" "}
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
      </Suspense>
    </div>
  );
}

//This page is just for testing the email confirmation endpoint. I want to make sure that when the user confirms their email, the GET request to this endpoint works and redirects the user to /landing. So I have this useEffect that makes a request to the email-confirmation endpoint. If everything works, then when I click the confirmation link in the email, I should see the data from that endpoint in the console and get redirected to /landing. If there is an error, then I will see that error in the console instead.
