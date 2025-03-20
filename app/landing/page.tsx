
import CheckoutInitiator from '../components/CheckoutInitiator.client';
import SessionManagerProvider from '../components/SessionManagerProvider';
import CustomVideo from '../components/CustomVideo';
import Image from 'next/image';
import FanPack from '../../public/fanpack.jpg';
import CheckIcon from '@mui/icons-material/Check';
import LandingToastNotifier from '../components/LandingToastNotifier';


export const metadata = {
  title: "Fan Pack",
  description: "Join now to get insider updates and your free Ultimate Fan Starter Pack."
};


const LandingPage = () => {
  
  return (
    <div>
    
      {/* This client component will fetch the TTL and then render the SessionManager. This strictly relates to the vality of the session using cookies. In terms of how long this cookie is valid for and what should happen as time decreases */}
      <SessionManagerProvider />
      {/* Include the client component for toast notifications */}
      <LandingToastNotifier />
      
      <div className='container'>
          <div className='tw-pb-8'>
            <h1 className='tw-text-center  tw-my-7 tw-text-white'>🏆 Your Ultimate Fan Starter Pack Includes: </h1>
            <h3 className='tw-text-center tw-text-primary'>4 Pieces<span className='tw-text-secondary'> Of Exclusive</span> Merchandise</h3>
            <h3 className='tw-text-center tw-text-white'> <span className='tw-line-through'>$10</span> - FREE today</h3>
            <h6 className='tw-text-center tw-text-white'>(just cover shipping and handling)</h6>
          </div>
          <div>
            <CustomVideo vidAddress="/video/thanks-for-subscribing.mp4"/>
          </div>
        </div>
        <div className='tw-bg-[rgba(22,121,136,0.74)] '>
          <div className='container tw-mx-auto tw-p-5 '>
            <div className=' tw-p-8'>
              <div className='tw-my-7'>
                <h1 className='tw-text-white tw-text-center'>Ultimate Fan Starter Pack</h1>
                <h3 className='tw-text-white tw-text-center'>Here's What Your're Going To Get...</h3>
              </div>
              <div className='tw-w-2/3 tw-mx-auto tw-pt-3'>
                <Image src={FanPack} className=' ' alt='picture of me'/>
              </div>
            </div>
            <div className='tw-flex tw-flex-col md:tw-flex-row '>
                <div className='md:tw-w-1/2 tw-mx-auto '>
                  <div className='tw-text-white'>
                    <p><CheckIcon /> An Exclusive Phone Ring ($5 Value)</p>
                    <p><CheckIcon /> A Customized Band Sticker ($3 Value)</p>
                    <p><CheckIcon /> A Rare Artist Bracelet ($3 Value)</p>
                    <p><CheckIcon /> A Personalized Key Chain ($5 Value)</p>
                  </div>
                </div>
                <div className='tw-flex tw-justify-center tw-items-center tw-w-1/2 tw-mx-auto'>
                  {/*This regards the stripe form. This component is what redirects the user to the appropriate page after the checkout. */}
                  <CheckoutInitiator />
                </div>
              </div>
          </div>
        </div>
    </div>
  )
}

export default LandingPage;
