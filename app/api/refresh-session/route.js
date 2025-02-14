import { cookies } from "next/headers";
import { generateTokenAndSalt, getSessionDataByToken, HttpError, updateSessionData } from '../../utils/sessionHelpers';


export async function POST(req) {
    try {
//Get current cookies (sessionToken and CSRF)
        const cookieStore = cookies();
        const sessionToken = cookieStore.get('sessionToken')?.value; //It always good to get the value safely

        if (!sessionToken) {
            throw new HttpError("Session token is required", 401);
        }

// Retrieve current session data. The way to get the current session is by using the getSessionDataByToken
        const currentSessionData = getSessionDataByToken(sessionToken);
        if (!currentSessionData) {
            throw new HttpError("Session not found or expired", 401);
        }

//Generate new tokens (both session and CSRF). I assigned values to the existing properties provided by the generateTokenAndSalt so its clear which values are being returned and used. For example, newSessionToken contains the generated session token. All I did was set it to a property do I can use 
        const { sessionToken: newSessionToken, csrfToken: newCsrfToken } = generateTokenAndSalt();

// Copy the current session data and update tokens accordingly
        const updatedSessionData = {
            ...currentSessionData,
            csrfToken: newCsrfToken,
        };

//So that i generate a new session token and csrf token, I want to assign the updated information to the newly created sessionToken. What we updated was a new CSRF token along with any other existing data with the old session token.
        await updateSessionData(newSessionToken, updatedSessionData, 3600);
    
// Reissue new cookies for sessionToken and CSRF token
        const sessionCookie = createCookie('sessionToken', newSessionToken);
        const csrfCookie = createCookie('csrfToken', newCsrfToken);
        return new Response(JSON.stringify({ message: 'Session refreshed' }), {
            status: 200,
            headers: { 'Set-Cookie': [sessionCookie, csrfCookie] }
        });
    } catch (error) {
        console.error("Error refreshing session:", error);
        if (error instanceof HttpError) {
          return new Response(JSON.stringify({ error: error.message }), { status: error.status });
        }
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
    
}