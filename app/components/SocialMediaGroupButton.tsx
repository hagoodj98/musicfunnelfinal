'use client';

import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import Button from '@mui/material/Button';

const SocialMediaButtonGroup = () => {
  return (
    <div className=' text-white w-1/2 items-center mx-auto justify-center flex  my-3'>
      <Button onClick={() => { window.open('https://www.facebook.com/peacsic8')}}><FacebookIcon className='text-white hover:text-yellow' fontSize='large' /></Button>
      <Button onClick={() => {window.open('https://www.instagram.com/peacsic8_/')}}><InstagramIcon className='text-white hover:text-yellow' fontSize='large' /></Button>
      <Button onClick={() => {window.open('https://x.com/Jaiquez5639321')}}><TwitterIcon className='text-white hover:text-yellow'  fontSize='large' /></Button>
    </div>
  )
}

export default SocialMediaButtonGroup;
