import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("../../components/SocialMediaGroupButton", () => ({
  default: () => <div data-testid="social-buttons" />,
}));
vi.mock("../../components/Metafooter", () => ({
  default: ({ name }: { name: string }) => <button>{name}</button>,
}));

import Footer from "../../components/Footer";

describe("Footer", () => {
  it("renders the artist handle", () => {
    render(<Footer />);
    expect(screen.getByText("@JH Studios")).toBeInTheDocument();
  });

  it("renders the current year in the copyright notice", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("renders the Privacy Policy link", () => {
    render(<Footer />);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });

  it("renders the Terms of Use link", () => {
    render(<Footer />);
    expect(screen.getByText("Terms of Use")).toBeInTheDocument();
  });

  it("renders the social media buttons area", () => {
    render(<Footer />);
    expect(screen.getByTestId("social-buttons")).toBeInTheDocument();
  });
});
