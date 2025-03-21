import SessionManagerProvider from "@/app/components/SessionManagerProvider"
import CustomVideo from "@/app/components/CustomVideo"
import Patreon from '../../components/JoinPatreon';

export const metadata = {
  title: "Thank You - Your Support Matters",
  description: "Thank you for your support! Your contribution helps fund future projects like music videos and online merch."
};

const ThankYouPage = () => {
  return (
    <div>
      <SessionManagerProvider />
      <div className='container'>
        <div className='lg:tw-w-10/12 lg:tw-mx-auto'>
          <div className='tw-pb-8'>
            <h1 className='tw-text-center tw-font-header tw-my-7 tw-text-white'>JOIN MY PATREON - <span className="tw-text-primary">YOUR SUPPORT HELPS FUND</span> FUTURE MUSIC VIDEOS, <span className="tw-text-primary">MUSIC</span>, AND AN ONLINE STORE</h1>
          </div>
          <div>
            <CustomVideo vidAddress="/video/take-this-journey-with-me.mp4"/>
          </div>
        </div>
      </div>
        <div className='tw-bg-[rgba(22,121,136,0.74)] '>
          <div className='container tw-mx-auto tw-p-5 '>
            <div className=' tw-p-8'>
              <div>
                <h1 className='tw-font-header tw-text-white tw-text-center'>Thank You For Your Support</h1>
              </div>
            </div>
            <div className="tw-text-white">
               <p>I really appreciate you supporting me and my music by purchasing the fan pack. This really means a lot to me!</p>
               <p>Look out for an email from me in the next few days confirming your shipping address.</p>
               <p>We cannot move forward shipping you your products until address is confirmed.</p>
               <p>If you have any questions or concerns, feel free to contact me via email.</p>
               <p>Thanks for being a <span className="tw-font-body tw-text-yellow">TRUE FAN!!</span></p>
                <div>
                  <Patreon />
                </div>
            </div>
          </div>
        </div>
    </div>

  )
}

export default ThankYouPage;
