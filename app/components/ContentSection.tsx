import React from "react";

const ContentSection = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <div className="bg-[rgba(22,121,136,0.74)] py-12 sm:py-16">
        <div className="container mx-auto flex flex-col items-center gap-10 px-6 lg:flex-row lg:justify-around lg:px-12">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ContentSection;
