import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../components/PrivacyOffCanvas", () => ({
  default: ({ name }: { name: string }) => <span>{name}</span>,
}));

import CookieConsentBanner from "../../components/CookieConsentBanner";

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("displays the banner when no consent is stored", () => {
    render(<CookieConsentBanner />);
    expect(screen.getByText("Understood")).toBeInTheDocument();
  });

  it("does not render when consent is already stored in localStorage", () => {
    localStorage.setItem("cookieConsent", "true");
    render(<CookieConsentBanner />);
    expect(screen.queryByText("Understood")).not.toBeInTheDocument();
  });

  it("hides the banner after clicking 'Understood'", () => {
    render(<CookieConsentBanner />);
    fireEvent.click(screen.getByText("Understood"));
    expect(screen.queryByText("Understood")).not.toBeInTheDocument();
  });

  it("persists the consent flag in localStorage after clicking 'Understood'", () => {
    render(<CookieConsentBanner />);
    fireEvent.click(screen.getByText("Understood"));
    expect(localStorage.getItem("cookieConsent")).toBe("true");
  });
});
