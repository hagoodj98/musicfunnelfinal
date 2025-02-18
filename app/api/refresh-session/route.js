import { cookies } from "next/headers";
import { generateTokenAndSalt, getSessionDataByToken, HttpError, updateSessionData, createCookie } from '../../utils/sessionHelpers';


export async function POST(req) {
    try {
//Get current cookies (sessionToken and CSRF)
        const cookieStore =  await cookies();
        const sessionToken = cookieStore.get('sessionToken')?.value; //It always good to get the value safely
        const csrfTokenFromCookie = cookieStore.get('csrfToken')?.value;

        if (!sessionToken) {
            throw new HttpError("Session token is required", 400);
        }
        if (!csrfTokenFromCookie) {
            throw new HttpError("CSRF token is required", 400);
        }

// Retrieve current session data. The way to get the current session is by using the getSessionDataByToken
        const currentSessionData = getSessionDataByToken(sessionToken);
// Verify that the CSRF token from the cookie matches the one stored in session data. The cookies are either the first set that were issued in /check-status or it could be a new set of cookies if user refreshed the session.
        if (csrfTokenFromCookie !== currentSessionData.csrfToken) {
            throw new HttpError("Invalid CSRF token. Unauthorized!", 403);
        }
      
//This line considers if a user clicked the rememberMe button, if so, then we would not want to refresh the session for only an hour simply becasue the user wanted the application to remmeber them. So we would set the ttl for about a week instead. If their is no  rememberMe flag, then yes, the session refreshes for another hour.
        const ttl = currentSessionData.rememberMe ? 604800 : 3600;

//Generate new tokens (both session and CSRF). I assigned values to the existing properties provided by the generateTokenAndSalt so its clear which values are being returned and used. For example, newSessionToken contains the generated session token. All I did was set it to a property so I can use 
        const { sessionToken: newSessionToken, csrfToken: newCsrfToken } = generateTokenAndSalt();

// Copy the current session data and update tokens accordingly
        const updatedSessionData = {
            ...currentSessionData,
            csrfToken: newCsrfToken,
        };

//So that i generate a new session token and csrf token, I want to assign the updated information to the newly created sessionToken similar to how we did it through /check-status. What we updated was a new CSRF token along with any other existing data feom the old session token.
        await updateSessionData(newSessionToken, updatedSessionData, ttl);
    
// Reissue or create new cookies for sessionToken and CSRF token. But logically, you want the session to be updated first, so that when you create the cookie, it reflects the correct, updated session information. Another way to think of cookies, a cookie Is what the client presents on each request so that the server can look up the session data. So think of a party. The server (host) gave the person a sticker with a note, but also told the person, whenever they come back with that sticker, you get a free gift. The way the person brings the sticker to the party host is by going to the same location of the party, is the same way a user sends a request to the server to get information about that  individual.

        const sessionCookie = createCookie('sessionToken', newSessionToken, { maxAge: ttl });
        const csrfCookie = createCookie('csrfToken', newCsrfToken, { maxAge: ttl } );
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