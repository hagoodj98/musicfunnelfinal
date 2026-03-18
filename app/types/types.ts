export type User = {
  name: string;
  email: string;
  rememberMe: boolean | undefined;
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
export type EmailContextValue = {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  rememberMe: boolean;
  setRememberMe: React.Dispatch<React.SetStateAction<boolean>>;
};
