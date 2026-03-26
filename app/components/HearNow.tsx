"use client";
import BrandButton from "./ui/BrandButton";
const HearNow = () => {
  return (
    <div>
      <BrandButton
        color="inherit"
        onClick={() => {
          window.open("https://jaiquez.hearnow.com/good");
        }}
        variant="outlined"
        sx={{
          color: "white",
          backgroundColor: "rgb(1, 10, 38, 0.8)",
          border: "none",
          minWidth: 220,
          paddingX: 3,
          paddingY: 1.1,
          "&:hover": {
            backgroundColor: "#FDEAB6",
            borderColor: "#FDEAB6",
            color: "rgb(1, 10, 38, 0.8)",
          },
        }}
        size="large"
      >
        <span className="font-header text-base uppercase tracking-[0.12em] sm:text-lg">
          Listen on HearNow
        </span>
      </BrandButton>
    </div>
  );
};

export default HearNow;
