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
  checkoutStatus?: "pending" | "completed" | "cancelled";
};
