"use client";
import { Drawer } from "@mui/material";
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
    console.log(`${name} clicked`);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="mx-2 text-white font-header underline underline-offset-2 transition hover:text-yellow"
      >
        {name}
      </button>
      <Drawer anchor={placement} open={show} onClose={handleClose}>
        <div className="bg-lighterblue text-white">
          <div className="font-header  text-white">{name}</div>
        </div>
        {children}
      </Drawer>
    </div>
  );
};

export default Metafooter;
