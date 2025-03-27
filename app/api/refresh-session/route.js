//import { cookies } from "next/headers";
import { cookies } from './headersWrapper.js';
import { generateTokenAndSalt, getSessionDataByToken, HttpError, updateSessionData, createCookie } from '../../utils/sessionHelpers.js';


export async function POST() {
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
        const currentSessionData = await getSessionDataByToken(sessionToken);

        if (csrfTokenFromCookie !== currentSessionData.csrfToken) {
            throw new HttpError("Invalid CSRF token. Unauthorized!", 403);
        }
      
        const ttl = currentSessionData.rememberMe ? 604800 : 900;

        const { sessionToken: newSessionToken, csrfToken: newCsrfToken } = generateTokenAndSalt();

// Copy the current session data and update tokens accordingly
        const updatedSessionData = {
            ...currentSessionData,
            csrfToken: newCsrfToken,
        };

        await updateSessionData(newSessionToken, updatedSessionData, ttl);

        const sessionCookie = createCookie('sessionToken', newSessionToken, { maxAge: ttl, sameSite: 'lax'  });
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