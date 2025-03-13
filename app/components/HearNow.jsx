'use client';
import Button from '@mui/material/Button';

const HearNow = () => {
  return (
    <div>
      <Button onClick={() => { window.open('https://jaiquez.hearnow.com/good')}} variant="outlined" className=' tw-mx-auto tw-bg-lighterblue tw-text-white tw-border-none hover:tw-bg-yellow hover:tw-border-yellow hover:tw-text-lighterblue' size="large">hearnow</Button>    
    </div>
  )
}

export default HearNow;
