export type User = {
  name: string;
  email: string;
  rememberMe: boolean;
};
export type ErrorMessage = {
  field: string;
  message: string;
};
export type UserSession = {
  email: string;
  name: string;
  status: "pending" | "subscribed" | "failed";
  rememberMe?: boolean;
  ttl?: number;
  secretToken?: string;
  csrfToken?: string;
  stripeSessionId?: string;
  checkoutStatus?:
    | "pending"
    | "completed"
    | "cancelled"
    | "initiated"
    | "active";
};
export type Severity = "success" | "error" | "info" | "warning";

export type EmailContextValue = {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  rememberMe: boolean;
  setRememberMe: React.Dispatch<React.SetStateAction<boolean>>;
};
