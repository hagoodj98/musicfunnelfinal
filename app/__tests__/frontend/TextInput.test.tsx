import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("@mui/material/TextField", () => ({
  default: ({
    label,
    value,
    onChange,
    name,
  }: {
    label: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
  }) => (
    <input
      aria-label={label}
      placeholder={label}
      name={name}
      value={value}
      onChange={onChange}
    />
  ),
}));
vi.mock("@mui/material/InputAdornment", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));
vi.mock("@mui/icons-material/Email", () => ({ default: () => <span>@</span> }));
vi.mock("@mui/icons-material/AccountCircle", () => ({
  default: () => <span>U</span>,
}));
vi.mock("@mui/icons-material/Group", () => ({ default: () => <span>G</span> }));

import TextInput from "../../components/ui/TextInput";

describe("TextInput", () => {
  it("renders the label text", () => {
    render(
      <TextInput
        label="Email address"
        value=""
        name="email"
        iconType="email"
      />,
    );
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
  });

  it("fires onChange when the user types", () => {
    const onChange = vi.fn();
    render(
      <TextInput
        label="Name"
        value=""
        name="name"
        iconType="account"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "Alice" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("reflects the controlled value", () => {
    render(
      <TextInput
        label="Username"
        value="bob"
        name="username"
        iconType="user"
      />,
    );
    expect(screen.getByPlaceholderText("Username")).toHaveValue("bob");
  });
});
