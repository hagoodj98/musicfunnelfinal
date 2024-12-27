'use client'

import { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Modal from 'react-bootstrap/Modal';
import InputAdornment from '@mui/material/InputAdornment';
import AccountCircle from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import GroupIcon from '@mui/icons-material/Group';

const SubscriptionForm = () => {
    const [userInfo, setUserInfo] = useState({
        name: "",
        email: ""
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [status, setStatus] = useState('idle')
    const [lgShow, setLgShow] = useState(false);
    const email = userInfo.email;
    useEffect(() => {
         if (!email) return; // Prevent polling if email is not set
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/check-status?email=${encodeURIComponent(email)}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch subscription status");
                }
                const data = await response.json();
                setStatus(data.status);
                if (data.status === 'subscribed') {
                    clearInterval(interval);
                    window.location.href = '/landing';
                }
            } catch (error) {
                console.error('Error fetching subscription status:', error);
                setStatus('error');
            }
            }, 5000); //Poll every 5 seconds

        return () => clearInterval(interval); //cleanup on unmount
    },[email]);

   
    const handleSubmit = async (event) => {
        event.preventDefault();

        if(!userInfo.email) {
            setErrorMessage('Email is required');
            return;
        }
        setStatus('pending');
        setErrorMessage(''); // Clear previous errors

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: userInfo.name,
                    email: userInfo.email
                })
            });
            
        } catch (error) {
            console.error('Subscription error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Failed to subscribe');
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
            <p>Subscription pending... Please check your email to confirm. Don't see it? Check Spam!</p>
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
