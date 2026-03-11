"use client";

import { createContext, useContext, useState } from "react";

type EmailContextValue = {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  rememberMe: boolean;
  setRememberMe: React.Dispatch<React.SetStateAction<boolean>>;
  shouldPoll: boolean;
  setShouldPoll: React.Dispatch<React.SetStateAction<boolean>>;
};

export const EmailContext = createContext<EmailContextValue | undefined>(
  undefined,
);

export const EmailProvider = ({ children }: { children: React.ReactNode }) => {
  // These states hold the subscriber's email and rememberMe flag.
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [shouldPoll, setShouldPoll] = useState(false);

  return (
    <EmailContext.Provider
      value={{
        email,
        setEmail,
        rememberMe,
        setRememberMe,
        shouldPoll,
        setShouldPoll,
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
