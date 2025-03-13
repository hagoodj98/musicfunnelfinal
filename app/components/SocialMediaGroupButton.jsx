'use client';

import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import Button from '@mui/material/Button';

const SocialMediaButtonGroup = () => {
  return (
    <div className=' tw-text-white tw-w-1/2 tw-flex tw-justify-around tw-my-3'>
      <Button className='tw-text-white' onClick={() => { window.open('https://www.facebook.com/peacsic8')}}><FacebookIcon className='hover:tw-text-yellow' fontSize='large' /></Button>
      <Button className='tw-text-white' onClick={() => {window.open('https://www.instagram.com/peacsic8_/')}}><InstagramIcon className='hover:tw-text-yellow' fontSize='large' /></Button>
      <Button className='tw-text-white' onClick={() => {window.open('https://x.com/Jaiquez5639321')}}><TwitterIcon className='hover:tw-text-yellow'  fontSize='large' /></Button>
    </div>
  )
}

export default SocialMediaButtonGroup;
