import Image from 'next/image';
import Form from './components/SubscriptionForm';
import MusicCover from '../public/GOOD (1).jpg';
import Button from '@mui/material/Button';
import Me from '../public/IMG_1856(1).jpg';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
export default function Home () {
  return (
    <div className="tw-bg-center ">
      <div className='tw-container tw-mx-auto'>
        <div className='tw-py-20'>
          <h1 className='tw-text-center  tw-my-7 tw-text-white'>I'M GIVING AWAY 4 OF MY MOST POPULAR PRODUCTS TO THE FIRST 50 FANS, <span className='tw-text-secondary'>ABSOLUTELY FREE!</span></h1>
          <h3 className='tw-text-center tw-text-primary'>Plus Get Early Access To <span className='tw-text-secondary'>New Music</span>, Livestreams, And Exclusive Merch Giveaways</h3>
          <h3 className='tw-text-center tw-text-white'>(100% Totally Free)</h3>
        </div>
        <div>
          <video width='1020' className='tw-mx-auto' height='340' controls preload="none"> 
            <source src="../public/video/Take This Journey With Me.mp4" type="video/mp4" />
          </video>
        </div>
        <div className='tw-mx-auto tw-w-1/4 tw-my-14'>
          <Button variant="contained" className='tw-flex tw-bg-secondary tw-p-5'> <ArrowForwardIosRoundedIcon fontSize='medium' /><h4>Yes! I like Free Stuff</h4><ArrowBackIosRoundedIcon fontSize='medium'  /></Button>
        </div>
        <div className='tw-flex tw-items-center tw-py-32 tw-bg-[rgba(22,121,136,0.74)]  '>
          <div className='tw-w-1/2 tw-relative '>
            <Image src={Me} className='tw-w-2/3 tw-absolute tw-inset-0 tw-m-auto' alt='picture of me'/>
          </div>
          <div className='tw-w-1/2 tw-p-14'>
            <div className='tw-my-7'>
              <h1 className='tw-text-white tw-text-center'>Jaiquez</h1>
              <h3 className='tw-text-white tw-text-center'>Singer-Songwriter</h3>
            </div>
            <p className='tw-text-white tw-text-center tw-text-xl'>His long-time interest in music fueled passion for songwriting and composing stories that make his audience feel more heard and less alone.</p>
            <p className='tw-text-white tw-text-center tw-text-xl'>His sit-down-conversational overtone approach to his songs enables him to give listeners a sense of humility and empowerment through his storytelling lyrics.</p>
            <h4 className='tw-text-white tw-text-center'>Join my FREE Private Community of authentic music fans and connect with me personally.</h4>
            <div className='tw-flex tw-items-center'>
              <span className=' tw-text-4xl tw-mx-auto tw-my-7'>👇</span>
            </div>
            <Form />
          </div>
        </div>
        <div className=' tw-bg-[rgba(239,77,18,0.34)] tw-flex '>
          <div className='tw-w-1/2 tw-relative'>
            <div className='tw-absolute tw-w-1/2 tw-h-1/6 tw-inset-0 tw-flex tw-flex-col tw- tw-m-auto'>
              <h3 className='tw-text-center tw-my-7 tw-text-white'>Check Out my Latest Release</h3>
              <Button variant="outlined" className='tw-w-1/2 tw-mx-auto tw-bg-lighterblue tw-text-white tw-border-none' size="large">hearnow</Button>    
            </div>
          </div>
          <div className='tw-w-1/2'>
            <Image alt='Latest Music Cover' src={MusicCover}  />
          </div>
      </div>
      </div>
     
    </div>
  );
}
