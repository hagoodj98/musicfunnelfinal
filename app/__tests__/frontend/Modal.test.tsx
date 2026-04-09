import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("@mui/material/Modal", () => ({
  default: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
    onClose?: () => void;
  }) => (open ? <div data-testid="mui-modal">{children}</div> : null),
}));
vi.mock("@mui/icons-material/Close", () => ({ default: () => <span>X</span> }));

import CustomModal from "../../components/ui/modal";

describe("CustomModal (ui/modal)", () => {
  const onClose = vi.fn();

  it("renders nothing when closed", () => {
    render(
      <CustomModal open={false} onClose={onClose} title="Hello">
        <p>Content</p>
      </CustomModal>,
    );
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders title and children when open", () => {
    render(
      <CustomModal open={true} onClose={onClose} title="My Title">
        <p>Body text</p>
      </CustomModal>,
    );
    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });

  it("renders the optional subtitle", () => {
    render(
      <CustomModal open={true} onClose={onClose} title="T" subtitle="Sub here">
        <span />
      </CustomModal>,
    );
    expect(screen.getByText("Sub here")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    render(
      <CustomModal open={true} onClose={onClose} title="T">
        <span />
      </CustomModal>,
    );
    fireEvent.click(screen.getByLabelText("Close modal"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
