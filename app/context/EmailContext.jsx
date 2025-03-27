'use client'

import { createContext, useState } from "react";

export const EmailContext = createContext();


export const EmailProvider = ({children}) => {
// These states hold the subscriber's email and rememberMe flag.
    const [email, setEmail] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [shouldPoll, setShouldPoll] = useState(false);

    return (
        <EmailContext.Provider value={{ email, setEmail, rememberMe, setRememberMe, shouldPoll, setShouldPoll }}>
            {children}
        </EmailContext.Provider>
    );
};