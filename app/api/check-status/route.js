import crypto from 'crypto';
import redis from '../../utils/redis';
import { serialize as serializeCookie } from 'cookie'
import { error } from 'console';


export async function GET(req, res) {
    const email = req.nextUrl.searchParams.get('email');

    const mapping = await redis.get(`emailToHashMapping:${email}`);
    if (!mapping) {
        console.error("Status Check Error: No mapping found for email:", email);
        return res.status(404).json({error: 'Sessiomn not found'});
    }
    const { emailHash } = JSON.parse(mapping);
    const sessionDataString = await redis.get(`session:${emailHash}`);
    //Again if sessionDataString does not exist, then that means there was an error on the webhook route. Probably cause user did not confirm email
    if (!sessionDataString) {
        console.error('Status Check Error: No session data found for email:', email);
        return res.status(404).json({ error: 'Session not found' });
    }
    const sessionData = JSON.parse(sessionDataString);  // Now you have access to `email`, `name`, `status`
    if (sessionData.status === 'subscribed') {
        const sessionToken = crypto.randomBytes(24).toString('hex');
        await redis.set(`session:${sessionToken}`, JSON.stringify(sessionDataessionData), 'EX', 3600);
 //set session token in an HTTP-only cookie
        const cookie = serializeCookie('sessionToken', sessionToken, {
            httpOnly: true, //Cookie inaccesible tp JavaScript's Document.cookie API
            secure: process.env.NODE_ENV !== 'development', //Use secure cookies in production
            path: '/',
            maxAge: 3600, // 1 hour
            sameSite: 'strict'
        });

        console.log(`Status Check Success: Session token issued for email: ${email}`);
        res.setHeader('Set-Cookie', cookie);
        return res.status(200).json({message: 'Session active', sessionToken });
    } else {
        console.error('Status Check Error: Unauthorized access attempt for email:', email);
        return res.status(401).json({error: 'Unauthorized access' });
    }

}