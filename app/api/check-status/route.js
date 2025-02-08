import crypto from 'crypto';
import redis from '../../utils/redis';
import { serialize as serializeCookie } from 'cookie'

export async function POST(req) {
    //This retrieves the email that was submitted during the intital subscription process. 
    const { email } = await req.json();
    console.log(email);

    if (!email) {
         return new Response(JSON.stringify({ error: 'Email parameter is required' }), { status: 400 });
    }
    try {
        let mapping; 
        try {
            mapping = await redis.get(`emailToHashMapping:${email}`);
            
        } catch (error) {
            console.error("Redis Error: Failed to retrieve email hash mapping:", error);
            return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
        }
        //Checking if mapping exists. Again /subscribe creates two caches, if emailToHashMapping does not exists at this point, then the user never entered any data.
        if (!mapping) {
            console.error("Status Check Error: No mapping found for email:", email);
            return new Response(JSON.stringify({ error: 'No session information found' }), { status: 404 });
        }
        //I don't have to check for the original salt anymore because mailchimps' webhook done that already and we set the key with the updated status to session:
        const { emailHash } = JSON.parse(mapping);
        console.log(emailHash, "compare");
        
        const sessionDataString = await redis.get(`session:${emailHash}`);
        console.log(sessionDataString, "these are existing data I have access to before I check it exist");
        
        //Again if sessionDataString does not exist, then that means user did not confirm email yet. The reason why is because if user confirmed email, then the webhook would have set a session: key. 
        if (!sessionDataString) {
            console.error('Status Check Error: No session data found for email:', email);
            return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
        }

        console.log(sessionDataString, "these are existing data I have access to after I check if it exists");
        
        const sessionData = JSON.parse(sessionDataString);  // Now you have access to `email`, `name`, `status`
        if (sessionData.status === 'subscribed') {
            const sessionToken = crypto.randomBytes(24).toString('hex');
            const csrfToken = crypto.randomBytes(24).toString('hex');
             // Generate CSRF token
            await redis.set(`session:${sessionToken}`, JSON.stringify({...sessionData, csrfToken }), 'EX', 3600);
    //I have a cookie(sticker) (with its name, value, and instructions) and I needed to write all that information down in a specific format(into a string) so the website can understand it later. This string is then sent in the HTTP response headers with the Set-Cookie header.
            const sessionCookie = serializeCookie('sessionToken', sessionToken, {
                httpOnly: true, //Cookie inaccesible tp JavaScript's Document.cookie API. This cookie(sticker) is in a locked envelope that only the server can open.
                secure: process.env.NODE_ENV !== 'development', //Use secure cookies in production. When the website is in production (not development), the cookie is only sent over a secure (encrypted) connection, so others can’t easily peek at it.
                path: '/',// This tells the cookie(sticker), “I belong everywhere in this place!”
                maxAge: 3600, // The cookie will expire after 3600 seconds (which is one hour). After that, the sticker is no longer valid.
                sameSite: 'strict',//With sameSite: 'strict', the cookie will only be sent if you are on the same site that set it, protecting it from being sent to other sites unintentionally.
            });
            //Set CSRF token in a separate cookie that's accesible to JavaScript
            const csrfCookie = serializeCookie('csrfToken', csrfToken, {
                secure: process.env.NODE_ENV !== 'development',
                path: '/',
                maxAge: 3600,
                sameSite: 'strict'
            });

            //Parsing a cookie means taking that string (from the HTTP request’s Cookie header) and converting it back into an object that your code can work with
           
            console.log(`Status Check Success: Session token issued for email: ${email}`);
            return new Response(JSON.stringify({ message: 'Session active', sessionToken: sessionToken }), {
                status: 200,
                headers: { 'Set-Cookie': [sessionCookie, csrfCookie] }//This tells the browser, “Here are your stickers (cookies).”
            });
        } else {
            console.error('Status Check Error: Unauthorized access attempt for email:', email);
            return new Response(JSON.stringify({ error: 'Unauthorized access' }), { status: 401 });
        } 
} catch (error) {
    console.error('Failed to process request:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }

}