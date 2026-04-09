"use client";
import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { Severity } from "../../types/types";

export type NotifierProps = {
  open: boolean;
  message: string;
  severity?: Severity;
  duration?: number;
  onClose?: (event?: React.SyntheticEvent | Event, reason?: string) => void;
};

const Notifier: React.FC<NotifierProps> = ({
  open,
  message,
  severity,
  duration = 3000,
  onClose,
}) => {
  return (
    <Snackbar open={open} autoHideDuration={duration} onClose={onClose}>
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Notifier;
