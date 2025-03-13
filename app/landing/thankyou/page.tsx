import SessionManagerProvider from "@/app/components/SessionManagerProvider"
import CustomVideo from "@/app/components/CustomVideo"
import Patreon from '../../components/JoinPatreon';


const ThankYouPage = () => {
  return (
    <div>
      <SessionManagerProvider />
      <div className='container'>
          <div className='tw-pb-8'>
            <h1 className='tw-text-center  tw-my-7 tw-text-white'>JOIN MY PATREON <span className="tw-text-primary">AND GET EXCLUSIVE ACCESS TO NEW MUSIC MUSIC VIDEOS,</span> BEHIND THE SCENE <span className="tw-text-primary">FOOTAGE, AND SO MUCH</span> more!</h1>
          </div>
          <div>
            <CustomVideo vidAddress="/video/take-this-journey-with-me.mp4"/>
          </div>
          <div>
            <Patreon />
          </div>
        </div>
        <div className='tw-bg-[rgba(22,121,136,0.74)] '>
          <div className='container tw-mx-auto tw-p-5 '>
            <div className=' tw-p-8'>
              <div>
                <h1 className='tw-text-white tw-text-center'>Thank You For Your Support</h1>
              </div>
            </div>
            <div className="tw-text-white">
               <p>I really appreciate you supporting me and my music by purchasing the fan pack. This really means a lot to me!</p>
               <p>Look out for an email from me in the next few days confirming your shipping address.</p>
               <p>We cannot move forward shipping you your products until address is confirmed.</p>
               <p>If you have any questions or concerns, feel free to contact me via email.</p>
               <p>Thanks for being a <span className="tw-text-yellow">TRUE FAN!!</span></p>
                
            </div>
          </div>
        </div>
    </div>

  )
}

export default ThankYouPage
