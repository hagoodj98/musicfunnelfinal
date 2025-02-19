'use client';
import { useEmailPolling } from '../utils/useEmailPolling';
import { EmailContext } from '../context/EmailContext';
import { useContext } from 'react';

const EmailPollingManager = () => {
      // Access email and rememberMe from context
    const {email, rememberMe, shouldPoll} = useContext(EmailContext);
    // Use the custom hook to poll the /api/check-status endpoint.
    const { status, error } = useEmailPolling(email, rememberMe, shouldPoll);

    // Optionally show or log the status/error
    console.log('Polling status:', status);
    if (error) {
    console.log('Polling error:', error);
    }
    
  return null;
}
 // This component does not render visible UI—its job is to keep polling active.
export default EmailPollingManager;
