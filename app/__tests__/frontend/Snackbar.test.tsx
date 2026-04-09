import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("@mui/material/Snackbar", () => ({
  default: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div data-testid="snackbar">{children}</div> : null),
}));
vi.mock("@mui/material/Alert", () => ({
  default: ({
    children,
    severity,
  }: {
    children: React.ReactNode;
    severity?: string;
  }) => (
    <div data-testid="alert" data-severity={severity}>
      {children}
    </div>
  ),
}));

import Notifier from "../../components/ui/snackbar";

describe("Notifier (ui/snackbar)", () => {
  it("renders the message when open", () => {
    render(<Notifier open={true} message="Hello world" />);
    expect(screen.getByTestId("snackbar")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<Notifier open={false} message="Hidden" />);
    expect(screen.queryByTestId("snackbar")).not.toBeInTheDocument();
  });

  it("passes the severity to the Alert", () => {
    render(<Notifier open={true} message="Err" severity="error" />);
    expect(screen.getByTestId("alert")).toHaveAttribute(
      "data-severity",
      "error",
    );
  });
});
