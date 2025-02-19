'use client'

import { createContext, useState } from "react";


//The context should include only what you plan to use across components.
// Create the context. This is like a special box where you store the email and the “remember me” flag so that any component that needs them can look in this box.
export const EmailContext = createContext();

// This component wraps around parts of your app, so that any child component can access the data in the box.
export const EmailProvider = ({children}) => {
// These states hold the subscriber's email and rememberMe flag.
    const [email, setEmail] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    //(e.g., shouldPoll) in the context or state that becomes true only after the user has completed the initial subscription.
    const [shouldPoll, setShouldPoll] = useState(false);

    return (
        <EmailContext.Provider value={{ email, setEmail, rememberMe, setRememberMe, shouldPoll, setShouldPoll }}>
            {children}
        </EmailContext.Provider>
    );
};