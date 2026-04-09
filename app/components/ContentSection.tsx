import React from "react";

type ContentSectionProps = {
  children: React.ReactNode;
  className?: string;
  backgroundSpace?: string;
};

const ContentSection = ({ children }: ContentSectionProps) => {
  return (
    <div>
      <div className={`bg-[rgba(22,121,136,0.85)] py-12 sm:py-16 `}>
        <div className={`container mx-auto  px-6 lg:flex lg:items-center  `}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ContentSection;
