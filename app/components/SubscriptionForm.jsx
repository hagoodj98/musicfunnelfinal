'use client'

import { useContext, useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Modal from 'react-bootstrap/Modal';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import AccountCircle from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import GroupIcon from '@mui/icons-material/Group';
import EmailChecker from './EmailConfirmationChecker';
import { EmailContext } from '../context/EmailContext';
import FindMe from './FindMe';
import CheckIcon from '@mui/icons-material/Check';
import { green } from '@mui/material/colors';
import { toast } from 'react-toastify';

const SubscriptionForm = () => {

    const {email, setEmail, rememberMe, setRememberMe, shouldPoll, setShouldPoll } = useContext(EmailContext);

//// Since the name is only used within SubscriptionForm, it remains local.
    const [name, setName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [status, setStatus] = useState('idle')
    const [lgShow, setLgShow] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
    //Once triggered we want to check if email exist first before proceeding with the remaining functionality of the handleSubmit function
        if (!email) {
            setErrorMessage('Email is required');
            return;
        }
        setStatus('pending');
        setErrorMessage(''); // Clear previous errors
    
        try {
            const subscribeResponse = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    rememberMe: rememberMe
                })
            });
            if (!subscribeResponse.ok) {
                throw new Error(`Something went wrong. please try again!`);
            }
            // If subscription is initiated successfully, allow polling:
            setShouldPoll(true);
        } catch (error) {
            console.error('Subscription error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Failed to process subscription request!');
        }
    };
// Unified change handler for both name and email
    function handleChange(event) {
        const {name, value}= event.target;
        if (name === "name") {
            setName(value);
        } else if (name === 'email') {
            setEmail(value);
        }
    }
// When status becomes 'confirmed', trigger a toast
    useEffect(() => {
        if (status === 'confirmed') {
          toast.success('Thank you for subscribing! Redirecting you the landing page..');
        }
    }, [status]);

  return (
    <div className='tw-flex'>
        <Button onClick={() => setLgShow(true)} 
        sx={{
            color: 'white',          // Force text color to white
            backgroundColor: 'rgb(1, 10, 38, 0.8)',  // or your 'lighterblue' color
            border: 'none',
            width: '40%',
            marginX: 'auto',
            '&:hover': {
            backgroundColor: '#FDEAB6',  // or your 'yellow'
            borderColor: '#FDEAB6',
            color: 'rgb(1, 10, 38, 0.8)',           // text color on hover
            },
        }}
  ><span className='tw-font-header'>Join The Family!</span></Button>
        <Modal
        size="lg"
        show={lgShow}
        onHide={() => setLgShow(false)}
         contentClassName="tw-bg-primary tw-border-0"
        aria-labelledby="example-modal-sizes-title-lg">
        <Modal.Header className='tw-bg-primary' closeVariant='white' closeButton>
          <Modal.Title className=' tw-border-none tw-flex tw-items-center' id="example-modal-sizes-title-lg">
          <GroupIcon className='tw-text-white' fontSize='large'/>
          <h4 className='tw-text-white tw-p-3 tw-font-header' >Enter Your Name and Email Below To
          <span className='tw-text-yellow'> Join The Family!</span></h4>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {status === 'pending' && (
                <div>
                     <EmailChecker email={email} rememberMe={rememberMe} onConfirmed={() => setStatus('confirmed')} />
                </div>
            )} 
            {(status === 'idle' || status === 'error' || status === 'pending' || status === 'confirmed') && 
            (
            <Form onSubmit={handleSubmit}>
                <TextField variant='standard' className='tw-text-white' fullWidth required id="outlined-required" slotProps={{
                input: {
                endAdornment: (
                    <InputAdornment  position="start">
                        <AccountCircle className='tw-text-lighterblue'  fontSize='large'/>
                    </InputAdornment>
                        ),
                    },
                }} 
                label="Your Name" name='name' value={name} onChange={handleChange}/>
                <br />
                <TextField fullWidth   variant='standard' className='tw-text-white' required id="outlined-required"
                slotProps={{
                    input: {
                    endAdornment: (
                        <InputAdornment position="start">
                            <EmailIcon className='tw-text-lighterblue' fontSize='large' />
                        </InputAdornment>
                            ),
                        },
                }} 
                type='email' name='email' label="Email" value={email} onChange={handleChange}/>
                <div className='tw-flex tw-flex-col'>
                    <br />
                    <label className='tw-font-header tw-text-lighterblue tw-w-40'>
                        <Checkbox defaultChecked onChange={e => setRememberMe(e.target.checked)}/>Remember Me
                    </label>
                    <br />
                    <Button disabled={status === 'pending'} sx={{
                        // Normal (enabled) styles:
                        backgroundColor: status === 'confirmed' ? green[500] : "secondary.main",
                        color: "white",
                        width: '50%',
                        marginX: 'auto',
                        borderColor: status === 'confirmed' ? green[500] : "secondary.main",
                        "&:hover": {
                          backgroundColor: status === 'confirmed' ? green[700] : "#FDEAB6",
                          borderColor: status === 'confirmed' ? green[700] : "#FDEAB6",
                          color: status === 'confirmed' ? "white" : "rgb(1, 10, 38, 0.8)",
                        },
                        "&.Mui-disabled": {
                          backgroundColor: "rgba(239, 76, 18, 0.6)",
                          color: "white",
                          borderColor: "rgba(239, 76, 18, 0.6)",
                          cursor: "not-allowed",
                          opacity: 1,
                        },
                    }} 
                    variant="outlined" 
                    className='tw-mx-auto ' 
                    type='submit'
                    >
                        <span className='tw-font-header'>
                            {status === 'pending' ? (
                                <>   
                                    <CircularProgress size="20px"   style={{ display: 'inline-flex', verticalAlign: 'middle' }} color='inherit' />
                                    <span className='tw-font-header tw-ml-2'> Pending Subscription.</span>
                                </>
                            ) : status === 'confirmed' ? ( 
                                <CheckIcon />
                            ) : (
                                'Join The Fam'
                            )}
                        </span>
                    </Button>
                    <FindMe />
                </div>
            </Form>
            )}
            {status === 'confirmed' && (
            <p className=''>Subscription confirmed! Redirecting to the landing page...</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default SubscriptionForm;