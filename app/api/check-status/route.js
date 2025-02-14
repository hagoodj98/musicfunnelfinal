import { getEmailMapping, getSessionDataByHash, generateTokenandSalt, createCookie, updateSessionData, HttpError } from '../../utils/sessionHelpers';


export async function POST(req) {
    try {
    //This retrieves the email that was submitted during the intital subscription process along with a flag "rememberMe". 
    const { email, rememberMe } = await req.json();
    
    
    if (!email) {
        throw new HttpError('Email parameter is required', 400);
    }
//If the radio button is checked then ttl will equal 604800. I would use the value of the ttl when updating the sessionData using updateSessionData. That way, the session stored in Redis will expire according to the rememberMe setting.

    const ttl = rememberMe ? 604800 : 3600; // 1 week vs 1 hour

    // Get the email mapping and corresponding session data
    const mapping = await getEmailMapping(email);
    const { emailHash } = mapping;
    const sessionData = await getSessionDataByHash(emailHash); //This function returns a parse JSON. sessionData have access to the existing properties
    // Only proceed if the user is officially subscribed
    if (sessionData.status !== 'subscribed') {
        throw new HttpError('Unauthorized access', 401);
    }
        
    // Generate new session and CSRF tokens
    const { sessionToken, csrfToken } = generateTokenandSalt();

    // Update session data with the CSRF token and store it in Redis
    await updateSessionData(sessionToken, { ...sessionData, csrfToken }, ttl);

    // Create cookies for session and CSRF tokens. The ttl value is based on if subscriber clicked the rememberMe feature.
    const sessionCookie = createCookie('sessionToken', sessionToken, { maxAge: ttl } );
    const csrfCookie = createCookie('csrfToken', csrfToken, { maxAge: ttl });

    console.log(`Status Check Success: Session token issued for email: ${email}`);

    return new Response(
      JSON.stringify({ message: 'Session active', sessionToken }),
      {
        status: 200,
        headers: { 'Set-Cookie': [sessionCookie, csrfCookie] }
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