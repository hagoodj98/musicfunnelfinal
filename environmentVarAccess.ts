import { HttpError } from "./app/utils/sessionHelpers";

export const checkEnvVariables = () => {
  const stripePriceId = process.env.STRIPE_PRICE_ID;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripePriceId) {
    throw new HttpError("Stripe Price ID is missing", 404);
  }
  if (!stripeSecretKey) {
    throw new HttpError("Stripe Secret Key is missing", 404);
  }
  if (!stripeWebhookSecret) {
    throw new HttpError("Stripe Webhook Secret is missing", 404);
  }
  return { stripePriceId, stripeSecretKey, stripeWebhookSecret };
};
