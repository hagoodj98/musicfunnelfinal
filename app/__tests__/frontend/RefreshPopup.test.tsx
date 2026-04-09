import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@mui/material/Modal", () => ({
  default: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div data-testid="mui-modal">{children}</div> : null),
}));
vi.mock("@mui/material/Button", () => ({
  default: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));
vi.mock("@mui/icons-material/AccessTime", () => ({ default: () => <span /> }));
vi.mock("@mui/icons-material/Close", () => ({ default: () => <span /> }));

import RefreshPopup from "../../components/RefreshPopup";

describe("RefreshPopup", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    global.fetch = vi.fn();
  });

  it("renders the session expiry message with the remaining seconds", () => {
    render(<RefreshPopup timeLeft={45} onClose={onClose} />);
    expect(
      screen.getByText(/Your session will expire in 45 seconds/i),
    ).toBeInTheDocument();
  });

  it("renders the 'Refresh me!' button", () => {
    render(<RefreshPopup timeLeft={30} onClose={onClose} />);
    expect(screen.getByText(/Refresh me!/i)).toBeInTheDocument();
  });

  it("renders the 'Back to Home' button", () => {
    render(<RefreshPopup timeLeft={30} onClose={onClose} />);
    expect(screen.getByText(/Back to Home/i)).toBeInTheDocument();
  });

  it("shows 'Refreshing...' and disables the button while the request is in-flight", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "ok" }),
    });
    render(<RefreshPopup timeLeft={30} onClose={onClose} />);
    const btn = screen.getByText(/Refresh me!/i).closest("button")!;
    fireEvent.click(btn);
    expect(screen.getByText(/Refreshing.../i)).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it("shows an error message when the refresh API call fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    render(<RefreshPopup timeLeft={30} onClose={onClose} />);
    fireEvent.click(screen.getByText(/Refresh me!/i).closest("button")!);
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  it("calls onClose and triggers a redirect when 'Back to Home' is clicked and the end-session call succeeds", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    // jsdom doesn't support full navigation; patch href via defineProperty
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });

    render(<RefreshPopup timeLeft={30} onClose={onClose} />);
    fireEvent.click(screen.getByText(/Back to Home/i).closest("button")!);
    await waitFor(() => {
      expect(window.location.href).toBe("/");
    });
  });
});
