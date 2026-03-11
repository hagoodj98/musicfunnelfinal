import Image from "next/image";
import SubscriptionForm from "./components/SubscriptionForm";
import MusicCover from "../public/GOOD (1).jpg";
import Me from "../public/IMG_1856(1).jpg";
import CustomVideo from "./components/CustomVideo";
import HearNow from "./components/HearNow";
import HomeToastNotifier from "./components/HomeToastNotifier";
import { Suspense } from "react";
export const metadata = {
  title: "Home",
  description:
    "Welcome to your ultimate fan community. Enjoy exclusive content, updates, and more.",
};

export default function Home() {
  return (
    <>
      <div className="bg-center">
        <Suspense fallback={null}>
          <HomeToastNotifier />
        </Suspense>
        {/* EmailPollingManager remains mounted continuously */}
        <div className="mx-auto">
          <div className="container mx-auto px-4">
            <div className="mx-auto lg:w-10/12">
              <div className="pb-8">
                <h1 className="font-header mx-auto mt-7 max-w-4xl text-center text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                  I&#39;M GIVING AWAY 4 OF MY MOST POPULAR PRODUCTS TO THE FIRST
                  50 FANS,{" "}
                  <span className="text-secondary">ABSOLUTELY FREE!</span>
                </h1>
                <h3 className="font-body mx-auto mt-4 max-w-3xl text-center text-2xl leading-snug text-primary sm:text-3xl">
                  Plus, receive occasional previews of{" "}
                  <span className="text-secondary">upcoming music</span>, live
                  streams, and special merch offers
                </h3>
                <h3 className="font-header mt-3 text-center text-base uppercase tracking-[0.14em] text-yellow sm:text-lg">
                  (100% Totally Free)
                </h3>
              </div>
              <div>
                <CustomVideo vidAddress="/video/welcome-to-me.mp4" />
              </div>
            </div>
          </div>
          <div className="bg-[rgba(22,121,136,0.74)] ">
            <div className="container mx-auto flex flex-col items-center p-5 lg:flex-row">
              <div className="w-full pt-10 lg:w-1/2">
                <Image src={Me} alt="picture of me" />
              </div>
              <div className="lg:w-1/2 p-8">
                <div className="rounded-2xl bg-lighterblue/30 p-6 backdrop-blur-[1px]">
                  <div className="my-4">
                    <h1 className="text-center font-header text-4xl text-white sm:text-5xl">
                      Jaiquez
                    </h1>
                    <h3 className="text-center font-body text-2xl text-yellow sm:text-3xl">
                      Singer-Songwriter
                    </h3>
                  </div>
                  <p className="text-center text-lg leading-relaxed text-yellow md:text-xl">
                    His long-time interest in music fueled passion for
                    songwriting and composing stories that make his audience
                    feel more heard and less alone.
                  </p>
                  <p className="mt-4 text-center text-lg leading-relaxed text-yellow md:text-xl">
                    His sit-down-conversational overtone approach to his songs
                    enables him to give listeners a sense of humility and
                    empowerment through his storytelling lyrics.
                  </p>
                  <h4 className="mt-6 text-center font-header text-2xl text-white sm:text-3xl">
                    Join my FREE Private Community of authentic music fans and
                    connect with me personally.
                  </h4>
                </div>
                <div className="flex items-center">
                  <span className=" text-4xl mx-auto my-7">👇</span>
                </div>
                <SubscriptionForm />
              </div>
            </div>
          </div>
          <div className="bg-[rgba(239,77,18,1)]">
            <div className="container mx-auto px-6 py-14 md:flex md:items-center">
              <div className="flex items-center justify-center py-6 md:w-1/2">
                <div className="flex max-w-xl flex-col items-center text-center">
                  <p className="font-header text-sm uppercase tracking-[0.16em] text-yellow sm:text-base">
                    Latest Release
                  </p>
                  <h3 className="mt-2 font-header text-4xl leading-tight text-white sm:text-5xl">
                    Check Out My New Single
                  </h3>
                  <p className="mt-4 max-w-md text-lg leading-relaxed text-yellow sm:text-xl">
                    Tap below to stream on your favorite platform and share it
                    with a friend who needs to hear it.
                  </p>
                  <div className="mt-6">
                    <HearNow />
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="mx-auto w-2/3 sm:w-1/2">
                  <Image alt="Latest Music Cover" src={MusicCover} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
