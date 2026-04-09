import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("@mui/material/Button", () => ({
  default: ({
    children,
    onClick,
    disabled,
    ...rest
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}));

import BrandButton from "../../components/ui/BrandButton";

describe("BrandButton", () => {
  it("renders its children", () => {
    render(<BrandButton>Click me</BrandButton>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<BrandButton onClick={onClick}>Press</BrandButton>);
    fireEvent.click(screen.getByText("Press"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when the disabled prop is set", () => {
    render(<BrandButton disabled>Locked</BrandButton>);
    expect(screen.getByText("Locked").closest("button")).toBeDisabled();
  });
});
