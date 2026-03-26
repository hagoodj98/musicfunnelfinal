import CheckoutInitiator from "../components/CheckoutInitiator.client";
import SessionManagerProvider from "../components/SessionManagerProvider";
import Image from "next/image";
import FanPack from "../../public/fanpack.jpg";
import CheckIcon from "@mui/icons-material/Check";
import IntroSection from "../components/IntroSection";
import ContentSection from "../components/ContentSection";
import PageMessenger from "../components/PageMessenger";
export const metadata = {
  title: "Fan Pack",
  description:
    "Join now to get insider updates and your free Ultimate Fan Starter Pack.",
};
const LandingPage = () => {
  return (
    <div>
      {/* This client component will fetch the TTL and then render the SessionManager. This strictly relates to the vality of the session using cookies. In terms of how long this cookie is valid for and what should happen as time decreases */}
      <SessionManagerProvider />

      <IntroSection videoAddress="/video/thanks-for-subscribing.mp4">
        <div className="pb-8">
          <h1 className="font-header mx-auto mt-7 max-w-4xl text-center text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
            🏆 Your Ultimate Fan Starter Pack Includes:{" "}
          </h1>
          <h3 className="font-body mx-auto mt-4 max-w-3xl text-center text-2xl leading-snug text-primary sm:text-3xl">
            4 Pieces<span className="text-secondary"> Of Exclusive</span>{" "}
            Merchandise
          </h3>
          <h3 className="font-body mx-auto mt-4 max-w-3xl text-center text-white text-2xl leading-snug sm:text-3xl">
            {" "}
            <span className="line-through">$10</span> - FREE today
          </h3>
          <h6 className="font-header mx-auto mt-2 max-w-3xl text-center text-lg text-white">
            (just cover shipping and handling)
          </h6>
        </div>
      </IntroSection>
      <ContentSection>
        <div className="w-full lg:w-1/2">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-white/25 bg-white/10 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <Image
              className="h-auto w-full rounded-xl object-cover"
              src={FanPack}
              alt="Ultimate Fan Starter Pack items"
              priority
            />
          </div>
        </div>
        <div className="mt-2 w-full text-center text-white lg:mt-0 lg:w-1/2">
          <h1 className=" font-header text-4xl text-white sm:text-5xl">
            Ultimate Fan Starter Pack
          </h1>
          <h3 className=" font-body text-2xl text-yellow sm:text-3xl">
            Here&#39;s What Your&#39;re Going To Get...
          </h3>
          <p className=" text-lg font-body">
            <CheckIcon /> An Exclusive Phone Ring ($5 Value)
          </p>
          <p className="text-lg font-body">
            <CheckIcon /> A Customized Band Sticker ($3 Value)
          </p>
          <p className="text-lg font-body">
            <CheckIcon /> A Rare Artist Bracelet ($3 Value)
          </p>
          <p className=" text-lg font-body">
            <CheckIcon /> A Personalized Key Chain ($5 Value)
          </p>
          <CheckoutInitiator />
        </div>
      </ContentSection>
      <PageMessenger />
    </div>
  );
};

export default LandingPage;
