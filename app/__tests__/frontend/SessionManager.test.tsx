import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("../../components/RefreshPopup", () => ({
  default: ({
    timeLeft,
    onClose,
  }: {
    timeLeft: number;
    onClose: () => void;
  }) => (
    <div data-testid="refresh-popup">
      <span>Session expires in {timeLeft}</span>
      <button onClick={onClose}>dismiss</button>
    </div>
  ),
}));

import SessionManager from "../../components/SessionManager";

describe("SessionManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the countdown timer initially", () => {
    render(<SessionManager initialTime={300} />);
    const timerEl = document.querySelector("p");
    expect(timerEl?.textContent).toMatch(/5/);
  });

  it("does not show the refresh popup at start when time is above the warning threshold", () => {
    render(<SessionManager initialTime={300} />);
    expect(screen.queryByTestId("refresh-popup")).not.toBeInTheDocument();
  });

  it("shows the refresh popup when the timer drops to the warning threshold (60 s)", () => {
    render(<SessionManager initialTime={61} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("refresh-popup")).toBeInTheDocument();
  });
});
