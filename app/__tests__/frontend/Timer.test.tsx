import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Timer from "../../components/Timer";

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the hidden time display", () => {
    render(
      <Timer
        initialTime={120}
        onTimeUpdate={vi.fn()}
        onWarning={vi.fn()}
        onExpire={vi.fn()}
      />,
    );
    expect(screen.getByText(/Time remaining:/i)).toBeInTheDocument();
  });

  it("calls onTimeUpdate on mount with the initial time", () => {
    const onTimeUpdate = vi.fn();
    render(
      <Timer
        initialTime={90}
        onTimeUpdate={onTimeUpdate}
        onWarning={vi.fn()}
        onExpire={vi.fn()}
      />,
    );
    expect(onTimeUpdate).toHaveBeenCalledWith(90);
  });

  it("calls onWarning when initial time is at or below 60 seconds", () => {
    const onWarning = vi.fn();
    render(
      <Timer
        initialTime={60}
        onTimeUpdate={vi.fn()}
        onWarning={onWarning}
        onExpire={vi.fn()}
      />,
    );
    expect(onWarning).toHaveBeenCalled();
  });

  it("calls onExpire when initial time is 0", () => {
    const onExpire = vi.fn();
    render(
      <Timer
        initialTime={0}
        onTimeUpdate={vi.fn()}
        onWarning={vi.fn()}
        onExpire={onExpire}
      />,
    );
    expect(onExpire).toHaveBeenCalled();
  });

  it("decrements time via setInterval", () => {
    const onTimeUpdate = vi.fn();
    render(
      <Timer
        initialTime={5}
        onTimeUpdate={onTimeUpdate}
        onWarning={vi.fn()}
        onExpire={vi.fn()}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    const calls = onTimeUpdate.mock.calls.map((c) => c[0]);
    expect(Math.min(...calls)).toBeLessThan(5);
  });

  it("displays formatted minutes and seconds", () => {
    render(
      <Timer
        initialTime={90}
        onTimeUpdate={vi.fn()}
        onWarning={vi.fn()}
        onExpire={vi.fn()}
      />,
    );
    expect(screen.getByText(/1:30/)).toBeInTheDocument();
  });
});
