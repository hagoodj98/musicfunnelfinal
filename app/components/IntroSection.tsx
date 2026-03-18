"use client";
import CustomVideo from "./CustomVideo";

type Props = {
  videoAddress: string;
  children?: React.ReactNode;
};

const IntroSection = ({ videoAddress, children }: Props) => {
  return (
    <div>
      <div className="container mx-auto px-4">
        <div className="mx-auto lg:w-10/12">
          {children}
          <div>
            <CustomVideo vidAddress={videoAddress} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroSection;
