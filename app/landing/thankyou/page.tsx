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
        <div className='lg:w-10/12 lg:mx-auto'>
          <div className='pb-8'>
            <h1 className='text-center font-header my-7 text-white'>JOIN MY PATREON FOR ONLY <span className="text-primary">$5 A MONTH</span>; YOUR SUPPORT HELPS FUND <span className="text-primary"> MUSIC VIDEOS</span> AND AN <span className="text-primary">ONLINE STORE.</span></h1>
          </div>
          <div>
            <CustomVideo vidAddress="/video/take-this-journey-with-me.mp4"/>
          </div>
        </div>
      </div>
        <div className='bg-[rgba(22,121,136,0.74)] '>
          <div className='container mx-auto p-5 '>
            <div className=' p-8'>
              <div>
                <h1 className='font-header text-white text-center'>Thank You For Your Support</h1>
              </div>
            </div>
            <div className="text-center text-white">
              <p>I really appreciate you supporting me and my music by purchasing the fan pack. This really means a lot to me!</p>
              <p>Look out for your reciept while we get your items shipped to the address you entered in. </p>
              <p>If you have any questions or concerns, feel free to contact me via email.</p>
              <p>Thanks for being a <span className="font-body text-yellow">REAL FAN!!</span></p>
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
