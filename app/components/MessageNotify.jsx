'use client';
import { useEffect } from "react"
import { toast } from 'react-toastify';


const MessageNotify = ({notify, type}) => {
    useEffect(() => {
         // First, check if a message prop was provided
    if (notify) {
        const [displayText] = notify.split('#');
        if (type === 'success') {
            toast.success(displayText);
        } 
        if (type === 'error') {
            toast.error(displayText);
        } 
      } else {
          
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
