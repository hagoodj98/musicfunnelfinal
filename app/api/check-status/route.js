import { getEmailMapping, getSessionDataByHash, generateTokens, createCookie, updateSessionData, HttpError } from '../../utils/sessionHelpers';


export async function POST(req) {
    try {
    //This retrieves the email that was submitted during the intital subscription process. 
    const { email } = await req.json();
    console.log(email);

    if (!email) {
        throw new HttpError('Email parameter is required', 400);
    }
    // Get the email mapping and corresponding session data
    const mapping = await getEmailMapping(email);
    const { emailHash } = mapping;
    const sessionData = await getSessionDataByHash(emailHash); //This function returns a parse JSON. sessionData have access to the existing properties
    // Only proceed if the user is officially subscribed
    if (sessionData.status !== 'subscribed') {
        throw new HttpError('Unauthorized access', 401);
    }
    // Update session data with the CSRF token and store it in Redis
    await updateSessionData(sessionToken, { ...sessionData, csrfToken });

    // Create cookies for session and CSRF tokens
    const sessionCookie = createCookie('sessionToken', sessionToken);
    const csrfCookie = createCookie('csrfToken', csrfToken);

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