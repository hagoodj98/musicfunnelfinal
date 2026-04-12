"use client";
import CustomVideo from "./CustomVideo";

type Props = {
  videoAddress: string;
  poster?: string;
  children?: React.ReactNode;
};

const IntroSection = ({ videoAddress, poster, children }: Props) => {
  return (
    <div>
      <div className="container mx-auto px-4">
        <div className="mx-auto lg:w-10/12">
          {children}
          <CustomVideo vidAddress={videoAddress} poster={poster} />
        </div>
      </div>
    </div>
  );
};

export default IntroSection;
