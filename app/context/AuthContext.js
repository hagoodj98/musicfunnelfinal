import { createContext, useContext, useEffect, useState } from "react";
import { checkSession } from '../utils/auth'; //Utility to check session validity

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function initAuth() {
            const user = await checkSession(); //Checks if the user's session is valid
            setUser(user);
            setLoading(false);
        }
        initAuth();
    }, []);
    
    return (
        <AuthContext.Provider value={{user,loading }}>
            {children}
        </AuthContext.Provider>
    );
}