import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("../../components/ui/BrandButton", () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

import HearNow from "../../components/HearNow";

describe("HearNow", () => {
  it("renders without crashing", () => {
    render(<HearNow />);
  });

  it("renders the 'Listen on HearNow' label", () => {
    render(<HearNow />);
    expect(screen.getByText(/Listen on HearNow/i)).toBeInTheDocument();
  });
});
