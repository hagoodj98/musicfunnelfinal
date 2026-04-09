import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";

type BrandTone = "primary" | "ghost";

type BrandButtonProps = ButtonProps & {
  tone?: BrandTone;
};

const toneStyles: Record<BrandTone, ButtonProps["sx"]> = {
  primary: {
    backgroundColor: "secondary.main",
    color: "white",
    borderColor: "secondary.main",
    "&:hover": {
      backgroundColor: "#FDEAB6",
      borderColor: "#FDEAB6",
      color: "rgb(1, 10, 38, 0.8)",
    },
    "&.Mui-disabled": {
      backgroundColor: "rgba(239, 76, 18, 0.6)",
      color: "white",
      borderColor: "rgba(239, 76, 18, 0.6)",
      cursor: "not-allowed",
      opacity: 1,
    },
  },
  ghost: {
    backgroundColor: "rgba(1, 10, 38, 0.8)",
    color: "white",
    borderColor: "rgba(1, 10, 38, 0.8)",
    "&:hover": {
      backgroundColor: "#FDEAB6",
      borderColor: "#FDEAB6",
      color: "rgb(1, 10, 38, 0.8)",
    },
  },
};

const BrandButton = ({
  tone = "primary",
  sx,
  children,
  ...props
}: BrandButtonProps) => {
  return (
    <Button
      {...props}
      sx={{
        ...toneStyles[tone],
        ...(sx as object),
      }}
    >
      {children}
    </Button>
  );
};

export default BrandButton;
