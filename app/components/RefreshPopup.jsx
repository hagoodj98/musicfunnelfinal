'use client';

import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from '@mui/material/Button';

//This is the popup that appears when the timer is low. It tells the user, “Your session is about to run out! Do you want extra time?”. 

//It shows the current number of seconds left (thanks to the Timer passing that info through the SessionManager).

//It has a button like “Refresh Session” that, when clicked, calls an API (your backend endpoint) to refresh the session—kind of like getting extra time in the game.

//If the refresh is successful, it hides itself (by calling an onClose callback), and the new session time is set (or the page is reloaded so the new session takes effect).

//
//
//This popup only shows when SessionManager tells it to. But in order for SessionManager to do so, Timer has to do what SessionManager told it to do first.

const RefreshPopup = ({ timeLeft, onClose }) => {

    //So if you think about the popup itself, what do i want in it. Well, the remaining time left (60 seconds), a button to make the API call, a refresher (to let the user know the session is in process of refreshing the session), and it needs to hide when successful and the new session time is set The latter needs to get track of time that is left, and it needs the ability to close itself, so we need a timeLeft and onclose callback. Remember, the SessionManager is showing the popup. So the onclose is coming from SessionManager to RefreshPopup as a prop.

    const [loading, setLoading] = useState(false);
    const [error, setError ] = useState(null);
    const [success, setSuccess ] = useState(null);

    const handleRefresh = async () => {
    //This takes place as soon as user hits the button. Now imagine, what would you expect? What about some kind of loading animation, well yea so we shoudl set that to true. Its loading, so we don't know if we are going to get an error or not, so we should set setError and setSuccess to nothing
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            //If the user clicks “Refresh Session,” the popup makes an API call to refresh the session.. This route regenerates both tokens, updated in redis and creates two new cookies off those tokens. We are not sending a body because we plan to get the key that is already stored in redis. We just grab the existing cookies and proceed 
            const response = await fetch("/api/refresh-session", {
                method: "POST",
            });
            //I want to make sure the response was made without issues
            if (!response.ok) {
                throw new Error("Failed to create checkout session.");
            }
            //At this point, the API request was successful so I want to set setSuccess to the success message from the response of the API request, close the popup, and reload the page 
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
          {/*The onHide is a prop expected by the React-Bootstrap Modal. It is a callback that is triggered when the user tries to close the modal (for example, by clicking the close button in the header). In my code, we pass our onClose function to onHide, so that whether the user clicks the close icon or the “Nope!” button, the same function (onClose) is called to hide the popup. */}
          {/*backdrop="static" prevents closing the modal by clicking outside, ensuring the user makes an explicit choice. */}
          <Modal show={true}  onHide={onClose} backdrop="static" keyboard={false}>
            <Modal.Header className='tw-bg-primary' closeButton>
              <Modal.Title>
                <h4 className='tw-text-white tw-p-4'>Session will expire soon</h4>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Your session will expire {timeLeft} seconds.</p>
                <p>Would you like to refresh your session?</p>
                {/* This error condition comes from the API  request to /refresh-session. If something wrong happens in the endpoint, then this error shows */}
                {error && <p style={{ color: "red" }}>Error: {error}</p>}
                {success && <p style={{ color: "green" }}>{success}</p>}
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={onClose} className='tw-bg-lighterblue tw-border-lighterblue hover:tw-bg-yellow hover:tw-border-yellow hover:tw-text-lighterblue'  disabled={loading} variant="contained">Nope!</Button>
              <Button onClick={handleRefresh} variant="contained" disabled={loading} className='tw-bg-secondary tw-border-secondary hover:tw-bg-yellow hover:tw-border-yellow hover:tw-text-lighterblue' >{loading ? "Refreshing..." : "Refresh me!"}</Button>
            </Modal.Footer>
          </Modal>
        </div>
      );
};

export default RefreshPopup;
