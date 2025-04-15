import { getEmailMapping, getSessionDataByHash, generateTokenAndSalt, createCookie, updateSessionData, HttpError } from '../../utils/sessionHelpers.js';


export async function POST(req) {
    try {
    const { email, rememberMe } = await req.json();
    
    if (!email) {
        // Throw an HttpError for missing email with a 400 status
        throw new HttpError('Email parameter is required', 400);
    }
    

    const ttl = rememberMe ? 604800 : 100; // 1 week vs 15 minutes

    const mapping = await getEmailMapping(email);

    const { emailHash } = mapping;
    const sessionData = await getSessionDataByHash(emailHash); 
    if (sessionData.status !== 'subscribed') {
        throw new HttpError('Unauthorized access', 401);
    }
    // Generate new session and CSRF tokens which we use to sent the cookie
    const { sessionToken, csrfToken } = generateTokenAndSalt();

    await updateSessionData(sessionToken, { ...sessionData, csrfToken }, ttl);

    const sessionCookie = createCookie('sessionToken', sessionToken, { maxAge: ttl, sameSite: 'lax' });
    
    const csrfCookie = createCookie('csrfToken', csrfToken, { maxAge: ttl });

    return new Response(
      JSON.stringify({ message: 'Session active', sessionToken }), 
      {
        status: 200,
        headers: { 'Set-Cookie': [sessionCookie, csrfCookie] } //Once cookies are created, they are sent to the browser.
      }
    );
   
} catch (error) {
    console.error('Failed to process request:', error);
  
    if (error instanceof HttpError) {
        return new Response(JSON.stringify({ error: error.message }), { status: error.status });
    }
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}