'use client';
import { useEffect } from "react"
import { ToastContainer, toast } from 'react-toastify';

const MessageNotify = () => {
    const notify = () => toast("Wow so easy!");
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const message = params.get('msg');
        if (message) {
            
        }



    })





    return (
        <div>
            <button onClick={notify}>Notify!</button>
            <ToastContainer />
        </div>
    )
}

export default MessageNotify;
