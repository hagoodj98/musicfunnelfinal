'use client'

import { useContext, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Modal from 'react-bootstrap/Modal';
import InputAdornment from '@mui/material/InputAdornment';
import AccountCircle from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import GroupIcon from '@mui/icons-material/Group';
import EmailChecker from './EmailConfirmationChecker';
import { EmailContext } from '../context/EmailContext';


const SubscriptionForm = () => {
//The component uses the EmailContext to store and retrieve email and rememberMe so that other components (like EmailPollingManager) can access these values.
    const {email, setEmail, rememberMe, setRememberMe, shouldPoll, setShouldPoll } = useContext(EmailContext);

//// Since the name is only used within SubscriptionForm, it remains local.
    const [name, setName] = useState('');

    const [errorMessage, setErrorMessage] = useState('');
    //When user clicks the subscribe button, it triggers the handleSubmit function, assuming their is an email, we want to set the status to pending. If status equals 'pending' then show a pending message.
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
    }
// Unified change handler for both name and email
    function handleChange(event) {
        const {name, value}= event.target;
        if (name === "name") {
            setName(value);
        } else if (name === 'email') {
            setEmail(value);
        }
    }

  return (
    <div className='tw-flex '>
        <Button onClick={() => setLgShow(true)} className=' tw-bg-lighterblue tw-p-2 hover:tw-bg-yellow hover:tw-border-yellow hover:tw-text-lighterblue tw-text-white tw-w-2/5 tw-mx-auto '>Join The Family!</Button>
        <Modal
        size="lg"
        show={lgShow}
        
        onHide={() => setLgShow(false)}
         contentClassName="tw-bg-primary tw-border-0"
        aria-labelledby="example-modal-sizes-title-lg">
        <Modal.Header className='tw-bg-primary  ' closeButton>
          <Modal.Title className=' tw-border-none tw-flex tw-items-center' id="example-modal-sizes-title-lg">
          <GroupIcon className='tw-text-white' fontSize='large'/>
          <h4 className='tw-text-white tw-p-3' >Enter Your Name and Email Below To
          <span className='tw-text-yellow'> Join The Family!</span></h4>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body  className='tw-bg-primary'>
            {/*This is initial. We want to render a pending message letting the user know what they should do next */}
            {status === 'pending' && (
                <div>
                     {/* Render the EmailChecker component and pass the email because once the user hits the subscribe button we want to start checking for an updated status. This EmailChecker handles the polling that runs every 10 seconds watching for updates to the user subsscription status */}
                     <EmailChecker email={email} rememberMe={rememberMe} />
                </div>
           
            )} 
            {status === 'error' && <p style={{ color: 'red' }}>{errorMessage}</p>}
            {/*regardless of the status i always want to keep the form displayed. We don't want it to disappear randomly */}
            {(status === 'idle' || status === 'error' || status === 'pending') && 
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
                    <label className='tw-text-lighterblue tw-w-40'>
                        <Checkbox defaultChecked onChange={e => setRememberMe(e.target.checked)}/>Remember Me
                    </label>
                    <br />
                    <Button variant="outlined" className='tw-border-secondary hover:tw-bg-yellow hover:tw-border-yellow hover:tw-text-lighterblue tw-bg-secondary tw-text-white tw-w-1/2 tw-mx-auto' type='submit'>Join The Fam</Button>
                </div>
               
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