import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import CheckoutForm from "../../components/CheckoutForm";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
// Mock @stripe/react-stripe-js/checkout
vi.mock("@stripe/react-stripe-js/checkout", () => ({
  useCheckout: () => ({
    type: "success",
    checkout: {
      canConfirm: true,
      total: { total: { amount: "$10.00" } },
      confirm: () => ({ type: "success" }),
    },
  }),
  PaymentElement: () => <div data-testid="payment-element" />,
  BillingAddressElement: () => <div data-testid="billing-address-element" />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ShippingAddressElement: (props: any) => (
    <div data-testid="shipping-address-element" {...props} />
  ),
}));

describe("CheckoutForm", () => {
  it("renders the form", () => {
    render(<CheckoutForm email="test@example.com" />);
    expect(screen.getByText(/Complete Your Purchase/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByTestId("billing-address-element")).toBeInTheDocument();
    expect(screen.getByTestId("shipping-address-element")).toBeInTheDocument();
    expect(screen.getByTestId("payment-element")).toBeInTheDocument();
  });
});
