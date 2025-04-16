'use client';

import { useState } from "react"
import MessageNotify from "./MessageNotify";
import Modal from 'react-bootstrap/Modal';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import EmailIcon from '@mui/icons-material/Email';
import { TextField } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const FindMe = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');  // This will hold the actual message text
    const [messageType, setMessageType]= useState('');
    const [loading, setLoading]=useState(null);
    const [show, setShow] = useState(false);
    const [smShow, setSmShow] = useState(false);

    const handleFindMe = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res= await fetch('/api/check-subscriber', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email})
            });
            const data= await res.json();
            if (!res.ok) {
                 // Set the message state to the error message and show toast
                 setMessage(`${data.error || "Something went wrong."}#${Date.now()}`);
                 setMessageType('error');
                 //toast.error(data.message || 'Something went wrong. Please try again.');
                return;
            }
            // Set the message state to the success message and show toast
            setMessage(`${data.message}#${Date.now()}`);
            setMessageType('success');
            setLoading(false);
             
            window.location.href = '/landing';
        } catch (error) {
            console.error('Error checking subscription:', error);
            setMessage('Internal error. Please try again later. 🛑');
            setMessageType('error');
        }
        finally {
            setLoading(false);
      }
    }
      return (
    <div className=" tw-mx-auto">
        <Button onClick={() => setSmShow(true)}>
            
            <span className=" tw-text-lighterblue tw-font-header" >Already Subscribed?</span>
            
        </Button>
        <MessageNotify notify={message} type={messageType} />
        <Modal
        size="sm"
        show={smShow}
        onHide={() => setSmShow(false)}
        className="tw-bg-lighterblue"
        aria-labelledby="example-modal-sizes-title-sm"
      >
        <Modal.Header className="tw-bg-primary" closeVariant="white" closeButton>
          <Modal.Title  id="example-modal-sizes-title-sm">
            <h4 className="tw-font-header tw-text-white">Find If You Are Subscribed</h4>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body >
            <form className="tw-flex tw-flex-col" onSubmit={handleFindMe}>
                <TextField variant='standard' type="email" fullWidth required id="outlined-required" slotProps={{
                input: {
                endAdornment: (
                    <InputAdornment position="start">
                        <EmailIcon className='tw-text-lighterblue' fontSize='large' />
                    </InputAdornment>
                        ),
                    },
                }} 
                label="Your Email" name='email' value={email} onChange={e => setEmail(e.target.value)}/>
                <br />
                <Button disabled={loading} sx={{
                        // Normal (enabled) styles:
                        backgroundColor: "secondary.main",
                        color: "white",
                        marginX: 'auto',
                        width:"auto",
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
                    }} className=" tw-bg-secondary tw-border-secondary tw-mt-4 tw-w-1/2 hover:tw-bg-yellow hover:tw-border-yellow hover:tw-text-lighterblue tw-mx-auto tw-text-white" type="submit" variant="outlined">
                    <span className="tw-font-header">
                          {loading ? (
                      <>
                        <Box sx={{ display: 'flex' }}>
                          <CircularProgress size="30px" color='inherit' />
                        </Box>
                        <span> Checking...</span>
                      </>
                    ) : ('Find Me!')} 
                    </span>
                </Button>
            </form>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default FindMe;
