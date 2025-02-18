'use client'

import { useState } from 'react';
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
//I set the userInfo to an object with properties name and email since that is what we are collecting in the input fields below this component
    const [userInfo, setUserInfo] = useState({
        name: "",
        email: ""
    });
//This state takes care of the rememberMe toggle feature where we want to extend the life of the cookie to remain valid in the eyes of the middleware which restricts access to the rest of the application based on the validity of the cookie. This tells the app to keep the user logged in for a longer period even if the user closed the browser. Instead of a short session (say, 1 hour), the session might last several days or even weeks.  And again, since the life of the cookie is extended, the middleware sees this cookie as still valid.
    const [rememberMe, setRememberMe]= useState(false);

    const [errorMessage, setErrorMessage] = useState('');
    //When user clicks the subscribe button, it triggers the handleSubmit function, assuming their is an email, we want to set the status to pending. If status equals 'pending' then show a pending message.
    const [status, setStatus] = useState('idle')
    const [lgShow, setLgShow] = useState(false);
    

    const handleSubmit = async (event) => {
        event.preventDefault();
    
    //Once triggered we want to check if email exist first before proceeding with the remaining functionality of the handleSubmit function
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
            {/*This is initial. We want to render a pending message letting the user know what they should do next */}
            {status === 'pending' && (
                <div>
                     {/* Render the EmailChecker component and pass the email because once the user hits the subscribe button we want to start checking for an updated status. This EmailChecker handles the polling that runs every 10 seconds watching for updates to the user subsscription status */}
                     <EmailChecker email={userInfo.email} />
                </div>
           
            )}
            {status === 'error' && <p style={{ color: 'red' }}>{errorMessage}</p>}
            {/*regardless of the status i always want to keep the form displayed. We don't want it to disappear randomly */}
            {(status === 'idle' || status === 'error' || status === 'pending') && 
            (
            <Form onSubmit={handleSubmit}>
                 <div>
            
        </div>
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