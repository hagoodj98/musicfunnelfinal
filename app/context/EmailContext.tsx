"use client";

import { createContext, useContext, useState } from "react";
import { EmailContextValue } from "../types/types";

export const EmailContext = createContext<EmailContextValue | undefined>(
  undefined,
);

export const EmailProvider = ({ children }: { children: React.ReactNode }) => {
  // These states hold the subscriber's email and rememberMe flag.
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <EmailContext.Provider
      value={{
        email,
        setEmail,
        rememberMe,
        setRememberMe,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
};

export const useEmailContext = () => {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error("useEmailContext must be used within EmailProvider");
  }
  return context;
};
