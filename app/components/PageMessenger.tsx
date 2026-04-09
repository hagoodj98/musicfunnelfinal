"use client";
import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SnackbarComponent from "./ui/snackbar";
import { Severity } from "../types/types";
import { useRouter } from "next/navigation";

const PageMessenger = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const msg = searchParams.get("msg");
  const deCodedMsg = msg ? decodeURIComponent(msg) : null;
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
  });
  const [notifierSeverity, setNotifierSeverity] = React.useState<Severity>();

  useEffect(() => {
    if (deCodedMsg) {
      setSnackbar({
        open: true,
        message: deCodedMsg,
      });
      setNotifierSeverity("info");

      const timer = setTimeout(() => {
        if (deCodedMsg.includes("You cannot proceed")) {
          router.push("/");
        } else if (deCodedMsg.includes("Redirecting to landing page")) {
          router.push("/landing");
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deCodedMsg]);

  return (
    <div>
      {deCodedMsg && (
        <div>
          <SnackbarComponent
            message={snackbar.message}
            open={snackbar.open}
            severity={notifierSeverity}
          />
        </div>
      )}
    </div>
  );
};

export default PageMessenger;
