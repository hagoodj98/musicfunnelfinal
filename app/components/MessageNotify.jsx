'use client';
import { useEffect } from "react"
import { ToastContainer, toast } from 'react-toastify';


const MessageNotify = ({notify, type}) => {
    useEffect(() => {
         // First, check if a message prop was provided
    if (notify) {
        // If the message has a #, strip out the suffix for display
        const [displayText] = notify.split('#');
        if (type === 'success') {
            toast.success(displayText);
        } 
        if (type === 'error') {
            toast.error(displayText);
        } 
      } else {
            //When the landing page loads, it reads the URL for that sticky note (query parameter msg). If it finds one, it uses React Toastify to pop up a friendly little notification that shows the message. Then, it cleans up the URL so the message doesn’t show up again if the page is reloaded
            const params = new URLSearchParams(window.location.search);
            const message = params.get('msg');
            if (message) {
                toast.info(decodeURIComponent(message));
                // Optionally, remove the query parameter from the URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    },[notify, type]);

    return (
        <div>
           
        </div>
    )
}

export default MessageNotify;
