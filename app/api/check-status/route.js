import { getEmailMapping, getSessionDataByHash, generateTokenAndSalt, createCookie, updateSessionData, HttpError } from '../../utils/sessionHelpers';


export async function POST(req) {
    try {
    //This retrieves the email that was submitted during the intital subscription process along with a flag "rememberMe". The email and rememberMe comes from EmailConfirmationChecker components. We sent the content from the SubscriptioForm component by passing in the email the user entered
    const { email, rememberMe } = await req.json();
    
    if (!email) {
        // Throw an HttpError for missing email with a 400 status
        throw new HttpError('Email parameter is required', 400);
    }
    
//If the radio button is checked then ttl will equal 604800. I would use the value of the ttl when updating the sessionData using updateSessionData. That way, the session stored in Redis will expire according to the rememberMe setting.

    const ttl = rememberMe ? 3600 : 3600; // 1 week vs 1 hour

    // Get the email mapping and corresponding session data that we set in /subscribe first and set it to mapping which is now a json object to access the values of the key "emailToHashMapping:${email}"
    const mapping = await getEmailMapping(email);
    //I am only interested in the emailHash from the emailToHashMapping:${email} key. Because after the mailchimp webhook updated the scription status, I set a new key session:${emailHash}. We want that emailHash to be able to get the key with the updated 'status' property. Once we have the emailHash, we set it to sessionData which now becomes a json object where we can now use the updated status.
    const { emailHash } = mapping;
    const sessionData = await getSessionDataByHash(emailHash); //This function returns a parse JSON. sessionData have access to the existing properties like the status property.
    // Only proceed if the user is officially subscribed, otherwise throw an error because apparently the user is not subscribed
    if (sessionData.status !== 'subscribed') {
        throw new HttpError('Unauthorized access', 401);
    }
    // Generate new session and CSRF tokens which we use to sent the cookie
    const { sessionToken, csrfToken } = generateTokenAndSalt();

    // Update session data with the CSRF token and store it in Redis. The point of this line of code is to store the cookie in Redis for later use in the application by setting a new key "session:${sessionToken}" along with the exisiing data like name, email, blah blah. But we also want to store the CSRF token(cookie) that is associated with the sessionToken (cookie). Because we will use the CSRF token to authenticate the user with something the browser already knows the user by. That is the cookie called sessionToken. We set a ttl of course
    await updateSessionData(sessionToken, { ...sessionData, csrfToken }, ttl);

    // Create cookies for session and CSRF tokens. The ttl value is based on if subscriber clicked the rememberMe button.
    const sessionCookie = createCookie('sessionToken', sessionToken, { maxAge: ttl, sameSite: 'lax' });
    //This CSRF is 'strict'. Only avaiable on my app
    const csrfCookie = createCookie('csrfToken', csrfToken, { maxAge: ttl });

    console.log(`Status Check Success: Session token issued for email: ${email}`);

    return new Response(
      JSON.stringify({ message: 'Session active', sessionToken }), //We are including the sessionToken cookie in the response header because in the EmailConfirmationChecker, once we confirm the response was ok, we just want to make sure that a sessionToken has been generated. This tells us that a sessionToken cookie has been created so it is safe to redirect the user to /landing which is controlled by the middleware.
      {
        status: 200,
        headers: { 'Set-Cookie': [sessionCookie, csrfCookie] } //Once cookies are created, they are sent to the browser.
      }
    );
   
} catch (error) {
    console.error('Failed to process request:', error);
     //	In the outer try/catch, if any error is thrown, check if it’s an instance of HttpError (it will have a status property according to what i had setup in the sessionHelper functions). Use that status in the response; otherwise, default to 500.
    if (error instanceof HttpError) {
        return new Response(JSON.stringify({ error: error.message }), { status: error.status });
    }
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}