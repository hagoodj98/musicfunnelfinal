'use client';

import Button from '@mui/material/Button';
import ForwardIcon from '@mui/icons-material/Forward';
import Link from 'next/link';

const JoinPatreon = () => {
  return (
    <div className='tw-flex tw-justify-center tw-my-7'>
      <Button onClick={() => { window.open('patreon.com/Jaiquez')}} sx={{
                        // Normal (enabled) styles:
                        backgroundColor: "secondary.main",
                        color: "white",
                        borderColor: "secondary.main",
                        "&:hover": {
                        backgroundColor: "#FDEAB6",
                        borderColor: "#FDEAB6",
                        color: "rgb(1, 10, 38, 0.8)",
                        },

                        // Disabled styles:
                        "&.Mui-disabled": {
                        // For example, a semi-transparent version of your secondary color
                        backgroundColor: "rgba(239, 76, 18, 0.6)",
                        color: "white",
                        borderColor: "rgba(239, 76, 18, 0.6)",
                        cursor: "not-allowed",
                        opacity: 1, // override default MUI disabled opacity if desired
                        },
                    }} variant="contained" className='tw-font-header' type="submit"> <ForwardIcon />Yes! I want to join your patreon.</Button>
                    
    </div>
  )
}

export default JoinPatreon;
