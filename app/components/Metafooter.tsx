"use client";
import { Drawer, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";

type MetafooterProps = {
  name: string;
  children?: React.ReactNode;
  placement: "left";
};

const Metafooter: React.FC<MetafooterProps> = ({
  name,
  children,
  placement,
}) => {
  const [show, setShow] = React.useState(false);

  const handleClose = () => setShow(false);
  const handleClick = () => {
    setShow(true);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="mx-2 font-header underline underline-offset-2 text-white transition hover:text-yellow"
      >
        {name}
      </button>
      <Drawer
        anchor={placement}
        open={show}
        onClose={handleClose}
        PaperProps={{
          className:
            "bg-lighterblue! w-full max-w-sm sm:max-w-md flex flex-col",
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0">
          <h2 className="font-header text-lg font-bold tracking-wide text-yellow">
            {name}
          </h2>
          <IconButton onClick={handleClose} size="small" aria-label="Close">
            <CloseIcon className="text-white/70 hover:text-white" />
          </IconButton>
        </div>

        {/* Scrollable content */}
        <div
          className="
            flex-1 overflow-y-auto px-6 py-5 text-white/85
            [&_h3]:font-header [&_h3]:text-sm [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-widest [&_h3]:text-yellow/90 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:first:mt-0
            [&_h4]:font-header [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:uppercase [&_h4]:tracking-wider [&_h4]:text-white/60 [&_h4]:mt-4 [&_h4]:mb-1
            [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3 [&_p]:text-white/80
            [&_ul]:mb-3 [&_ul]:space-y-1.5
            [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-white/80 [&_li]:pl-2
          "
        >
          {children}
        </div>
      </Drawer>
    </div>
  );
};

export default Metafooter;
