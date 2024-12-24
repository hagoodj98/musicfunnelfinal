import crypto from 'crypto';
import redis from '@/app/utils/redis';





export async function GET(req) {
    const email = req.nextUrl.searchParams.get('email');
    if (!email){
        return new Response(JSON.stringify({error: 'Email is required'}), {status: 400});
    }

    const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
    // Check Redis for status
    const status = await redis.get(emailHash);
    if (!status) {
        return new Response(JSON.stringify({ status: 'unknown' }), { status: 200 });
    }
    return new Response(JSON.stringify({ status }), {status: 200 });
}










const listId = process.env.MAILCHIMP_LIST_ID;

export async function POST(request) {
try {
    const { email } = await request.json();
    const cacheKey = `status:${email}`;
    const cachedStatus = await redis.get(cacheKey);

    if(cachedStatus) {
        return new Response(JSON.stringify({subscriptionStatus: cachedStatus}), { status: 200});
    }
    const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

    //This is the API request to Check a contact’s subscription status
    const statusResponse = await mailchimp.lists.getListMember(
        listId,
        subscriberHash
      );
    // Cache the status for 5 minutes
    await redis.set(cacheKey, statusResponse.status, 'EX', 300);
} catch (error) {
    
}



}