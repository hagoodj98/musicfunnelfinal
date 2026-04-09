// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import JoinPatreon from "../../components/JoinPatreon";
import React from "react";

vi.mock("@mui/material/Button", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => <button {...props}>{props.children}</button>,
}));
vi.mock("@mui/icons-material/Forward", () => ({
  __esModule: true,
  default: () => <span data-testid="forward-icon" />,
}));

describe("JoinPatreon", () => {
  it("renders Patreon button", () => {
    render(<JoinPatreon />);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText(/join your patreon/i)).toBeInTheDocument();
    expect(screen.getByTestId("forward-icon")).toBeInTheDocument();
  });
});
