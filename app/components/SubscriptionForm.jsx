'use client'

import { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Modal from 'react-bootstrap/Modal';
import InputAdornment from '@mui/material/InputAdornment';
import AccountCircle from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import GroupIcon from '@mui/icons-material/Group';
// Import the EmailChecker component
import EmailChecker from './EmailConfirmationChecker';


const SubscriptionForm = () => {

    const [userInfo, setUserInfo] = useState({
        name: "",
        email: ""
    });
    const [rememberMe, setRememberMe]= useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [status, setStatus] = useState('idle')
    const [lgShow, setLgShow] = useState(false);
    

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        if (!userInfo.email) {
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
                    name: userInfo.name,
                    email: userInfo.email,
                    rememberMe: rememberMe
                })
            });
            if (!subscribeResponse.ok) {
                throw new Error(`Something went wrong. please try again!`);
            }
            
        } catch (error) {
            console.error('Subscription error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Failed to process subscription request!');
        }
    }
        function handleChange(event) {
            const {name, value}= event.target;
           
            setUserInfo(prevValue => {
                return {
                    ...prevValue,
                    [name]: value
                };
            });
        }

  return (
    <div className='tw-flex '>
        <Button onClick={() => setLgShow(true)} className=' tw-bg-secondary tw-p-2 tw-text-white tw-w-2/5 tw-mx-auto tw-text-xl'>Join The Family!</Button>
        <Modal
        size="lg"
        show={lgShow}
        onHide={() => setLgShow(false)}
        aria-labelledby="example-modal-sizes-title-lg">
        <Modal.Header closeButton>
          <Modal.Title id="example-modal-sizes-title-lg">
          <GroupIcon fontSize='large'/>Enter Your Name and Email Below To
          Join The Family!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body >  
            {status === 'pending' && (
                <div>
                    <p>Subscription pending... Please check your email to confirm. Don't see it? Check Spam!</p>
                     {/* Render the EmailChecker component and pass the email */}
                     <EmailChecker email={userInfo.email} />
                </div>
           
            )}
            {status === 'error' && <p style={{ color: 'red' }}>{errorMessage}</p>}
            {(status === 'idle' || status === 'error' || status === 'pending') && 
            (
            <Form onSubmit={handleSubmit}>
                <TextField fullWidth required id="outlined-required" slotProps={{
                input: {
                endAdornment: (
                    <InputAdornment position="start">
                        <AccountCircle  fontSize='large'/>
                    </InputAdornment>
                        ),
                    },
                }} 
                label="Your Name" name='name' value={userInfo.name} onChange={handleChange}/>
                <TextField fullWidth required id="outlined-required"
                slotProps={{
                    input: {
                    endAdornment: (
                        <InputAdornment position="start">
                            <EmailIcon fontSize='large' />
                        </InputAdornment>
                            ),
                        },
                }} 
                type='email' name='email' label="Email" value={userInfo.email} onChange={handleChange}/>
                <label>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}/>Remember Me
                </label>
                <Button variant="outlined" type='submit'>Subscribe</Button>
            </Form>
            )}
            {status === 'success' && (
            <p>Subscription confirmed! Redirecting to the landing page...</p>
            )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default SubscriptionForm;