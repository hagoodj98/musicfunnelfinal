import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";

import IntroSection from "../../components/IntroSection";

describe("IntroSection", () => {
  it("renders children inside the section", () => {
    render(
      <IntroSection videoAddress="/video/test.mp4">
        <h1>Intro heading</h1>
      </IntroSection>,
    );
    expect(screen.getByText("Intro heading")).toBeInTheDocument();
  });

  it("renders a video element pointing to the provided address", () => {
    render(<IntroSection videoAddress="/video/promo.mp4" />);
    const video = document.querySelector("video");
    expect(video).not.toBeNull();
  });
});
