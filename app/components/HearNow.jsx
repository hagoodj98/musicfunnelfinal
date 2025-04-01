'use client';
import Button from '@mui/material/Button';

const HearNow = () => {
  return (
    <div>
      <Button color="inherit" onClick={() => { window.open('https://jaiquez.hearnow.com/good')}} variant="outlined"  sx={{
    color: 'white',          // Force text color to white
    backgroundColor: 'rgb(1, 10, 38, 0.8)',  // or your 'lighterblue' color
    border: 'none',
    '&:hover': {
      backgroundColor: '#FDEAB6',  // or your 'yellow'
      borderColor: '#FDEAB6',
      color: 'rgb(1, 10, 38, 0.8)',           // text color on hover
    },
  }} size="large"> <span className='tw-font-header'>hearnow</span></Button>    
    </div>
  )
}

export default HearNow;
