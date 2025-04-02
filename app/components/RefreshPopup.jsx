'use client';

import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from '@mui/material/Button';

const RefreshPopup = ({ timeLeft, onClose }) => {

    const [loading, setLoading] = useState(false);
    const [error, setError ] = useState(null);
    const [success, setSuccess ] = useState(null);

    const handleRefresh = async () => {

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("/api/refresh-session", {
                method: "POST",
            });
            //I want to make sure the response was made without issues
            if (!response.ok) {
                throw new Error("Failed to create checkout session.");
            }
         
            const data = await response.json();
            //Hiding popup on success
            onClose();
            setSuccess(data.message);
            //This reloads the whole /landing to use the new session data
            window.location.reload();
            // On successful refresh, hide the popupz
        } catch (error) {
            console.error("Error refreshing session:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal show" style={{ display: 'block', position: 'initial' }}>
         
          <Modal show={true}  onHide={onClose} backdrop="static" keyboard={false}>
            <Modal.Header className='tw-bg-primary' closeVariant='white' closeButton>
              <Modal.Title>
                <h4 className='tw-font-header tw-text-white tw-p-4'>Session will expire soon</h4>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className='tw-font-header'>Your session will expire {timeLeft} seconds.</p>
                <p className='tw-font-body tw-text-xl'>Would you like to refresh your session?</p>
                <p className='tw-font-body tw-text-xl tw-text-secondary'>(note) You will be redirected back to the home page if you don't refresh the session.</p>
               
                {error && <p style={{ color: "red" }}>Error: {error}</p>}
                {success && <p style={{ color: "green" }}>{success}</p>}
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={onClose} 
                sx={{
                  marginRight: "5px",
                  backgroundColor: "rgb(1, 10, 38, 0.8)",
                  borderColor: "rgb(1, 10, 38, 0.8)",
                  color: "white",
                  "&:hover": {
                        backgroundColor: "#FDEAB6",
                        borderColor: "#FDEAB6",
                        color: "rgb(1, 10, 38, 0.8)",
                        }
                }}
                disabled={loading} variant="contained"><span className='tw-font-header'>Nope!</span></Button>
              <Button onClick={handleRefresh} variant="contained" disabled={loading} 
                sx={{
                  // Normal (enabled) styles:
                  backgroundColor: "secondary.main",
                  color: "white",
                  borderColor: "secondary.main",
                  "&:hover": {
                  backgroundColor: "#FDEAB6",
                  borderColor: "#FDEAB6",
                  color: "rgb(1, 10, 38, 0.8)",
                  }
                  }}> 
                <span className='tw-font-header'>{loading ? "Refreshing..." : "Refresh me!"}</span>
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      );
};

export default RefreshPopup;
