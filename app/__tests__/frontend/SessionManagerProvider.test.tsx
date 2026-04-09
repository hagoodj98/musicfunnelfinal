import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("../../context/EmailContext", () => ({
  useSessionTimeContext: () => ({ sessionTime: 0 }),
}));
vi.mock("../../components/SessionManager", () => ({
  default: ({ initialTime }: { initialTime: number }) => (
    <div data-testid="session-manager" data-time={initialTime}>
      Session active
    </div>
  ),
}));

import SessionManagerProvider from "../../components/SessionManagerProvider";

describe("SessionManagerProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the loading state while the session-info request is in-flight", () => {
    global.fetch = vi.fn(
      () => new Promise(() => {}),
    ) as unknown as typeof fetch;
    render(<SessionManagerProvider />);
    expect(screen.getByText(/Loading session time/i)).toBeInTheDocument();
  });

  it("renders SessionManager after fetching the TTL successfully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ttl: 300 }),
    }) as unknown as typeof fetch;

    render(<SessionManagerProvider />);
    await waitFor(() => {
      expect(screen.getByTestId("session-manager")).toBeInTheDocument();
    });
  });

  it("redirects to '/' when the session-info request fails", async () => {
    const mockPush = vi.fn();
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush }),
    }));

    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    render(<SessionManagerProvider />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/session-info");
    });
  });
});
