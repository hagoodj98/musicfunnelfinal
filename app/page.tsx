import Image from 'next/image';
import SubscriptionForm from './components/SubscriptionForm';
import MusicCover from '../public/GOOD (1).jpg';
import Me from '../public/IMG_1856(1).jpg';
import CustomVideo from './components/CustomVideo';
import HearNow from './components/HearNow';
import HomeToastNotifier from './components/HomeToastNotifier';

export const metadata = {
  title: "Home",
  description: "Welcome to your ultimate fan community. Enjoy exclusive content, updates, and more."
};

export default function Home () {

  return (
    <>
      <div className="tw-bg-center">
        <HomeToastNotifier />
          {/* EmailPollingManager remains mounted continuously */}
        <div className=' tw-mx-auto'>
          <div className='container'>
            <div className='lg:tw-w-10/12 lg:tw-mx-auto'>
              <div className='tw-pb-8 '>
                <h1 className= 'tw-font-header tw-text-center tw-mt-7 tw-text-white'>I&#39;M GIVING AWAY 4 OF MY MOST POPULAR PRODUCTS TO THE FIRST 50 FANS, <span className='tw-text-secondary'>ABSOLUTELY FREE!</span></h1>
                <h3 className='tw-font-body lg:tw-text-3xl tw-text-center tw-text-primary'>Plus, receive occasional previews of <span className='tw-text-secondary'>upcoming music</span>, live streams, and special merch offers</h3>
                <h3 className='tw-font-body tw-text-center tw-text-white'>(100% Totally Free)</h3>
              </div>
              <div>
              <CustomVideo vidAddress="/video/welcome-to-me.mp4" />
              </div>
            </div>
          </div>
          <div className='tw-bg-[rgba(22,121,136,0.74)] '>
            <div className='container tw-flex tw-flex-col lg:tw-flex-row tw-items-center tw-p-5 '>
              <div className='tw-w-1/2  tw-pt-10'>
                <Image src={Me} alt='picture of me'/>
              </div>
              <div className='lg:tw-w-1/2 tw-p-8'>
                <div className='tw-my-7'>
                  <h1 className='tw-text-white tw-text-center tw-font-header'>Jaiquez</h1>
                  <h3 className='tw-text-white tw-text-center tw-font-body'>Singer-Songwriter</h3>
                </div>
                <p className='tw-text-white tw-text-center tw-text-xl'>His long-time interest in music fueled passion for songwriting and composing stories that make his audience feel more heard and less alone.</p>
                <p className='tw-text-white tw-text-center tw-text-xl'>His sit-down-conversational overtone approach to his songs enables him to give listeners a sense of humility and empowerment through his storytelling lyrics.</p>
                <h4 className='tw-text-white tw-text-center tw-font-header'>Join my FREE Private Community of authentic music fans and connect with me personally.</h4>
                <div className='tw-flex tw-items-center'>
                  <span className=' tw-text-4xl tw-mx-auto tw-my-7'>👇</span>
                </div>
                <SubscriptionForm />
              </div>
            </div>
          </div>
          <div className=' tw-bg-[rgba(239,77,18,1)]'>
            <div className='container tw-p-12 tw-mx-auto  md:tw-flex '>
              <div className='tw-flex tw-items-center tw-justify-center md:tw-w-1/2 tw-py-6'>
                <div className=' tw-flex tw-flex-col tw-items-center '>
                  <h3 className='tw-text-center tw-text-white tw-font-header'>Check Out My Latest Release</h3>
                  <HearNow />
                </div>
              </div>
              <div className='md:tw-w-1/2 '>
                <div className=' tw-mx-auto tw-w-1/2'>
                  <Image alt='Latest Music Cover' src={MusicCover}  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
    </>
  );
}
