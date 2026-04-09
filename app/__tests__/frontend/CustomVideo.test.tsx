import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import CustomVideo from "../../components/CustomVideo";

describe("CustomVideo", () => {
  it("renders a <video> element with the supplied src", () => {
    const { container } = render(
      <CustomVideo vidAddress="/video/sample.mp4" />,
    );
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video!.src).toContain("sample.mp4");
  });

  it("has controls and playsInline in the markup", () => {
    const { container } = render(
      <CustomVideo vidAddress="/video/sample.mp4" />,
    );
    expect(container.innerHTML).toContain("controls");
    expect(container.innerHTML.toLowerCase()).toContain("playsinline");
  });

  it("renders inside an aspect-video container", () => {
    const { container } = render(
      <CustomVideo vidAddress="/video/sample.mp4" />,
    );
    expect(container.querySelector(".aspect-video")).toBeInTheDocument();
  });
});
