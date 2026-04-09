import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("@mui/material/Button", () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));
vi.mock("@mui/icons-material/Facebook", () => ({
  default: () => <span>FB</span>,
}));
vi.mock("@mui/icons-material/Instagram", () => ({
  default: () => <span>IG</span>,
}));
vi.mock("@mui/icons-material/Twitter", () => ({
  default: () => <span>TW</span>,
}));

import SocialMediaButtonGroup from "../../components/SocialMediaGroupButton";

describe("SocialMediaButtonGroup", () => {
  it("renders without crashing", () => {
    render(<SocialMediaButtonGroup />);
  });

  it("renders three social media buttons", () => {
    render(<SocialMediaButtonGroup />);
    expect(screen.getByText("FB")).toBeInTheDocument();
    expect(screen.getByText("IG")).toBeInTheDocument();
    expect(screen.getByText("TW")).toBeInTheDocument();
  });
});
