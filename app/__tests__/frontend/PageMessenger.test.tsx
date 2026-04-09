import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";

const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("../../components/ui/snackbar", () => ({
  default: ({
    open,
    message,
  }: {
    open: boolean;
    message: string;
    severity?: string;
  }) => (open ? <div data-testid="snackbar-message">{message}</div> : null),
}));

import PageMessenger from "../../components/PageMessenger";

describe("PageMessenger", () => {
  it("renders nothing when there is no msg query param", () => {
    mockGet.mockReturnValue(null);
    const { container } = render(<PageMessenger />);
    expect(container.firstElementChild?.children.length).toBe(0);
  });

  it("shows the snackbar with the decoded message when msg is present", () => {
    mockGet.mockReturnValue(encodeURIComponent("Welcome back!"));
    render(<PageMessenger />);
    expect(screen.getByTestId("snackbar-message")).toBeInTheDocument();
    expect(screen.getByText("Welcome back!")).toBeInTheDocument();
  });
});
