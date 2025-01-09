import { error } from "console";
import redis from "../../utils/redis";

export async function GET(req, res) {
    const sessionToken = req.query.sessionToken; //Assuming sessionToken is passed as a query parameter
    if (!sessionToken) {
        return res.status(401).json({error: 'Session token is required' });
    } 
    try {
        const sessionData = await redis.get(`session:${sessionToken}`);
        if (sessionData) {
            const updatedSessionData = {
                ...JSON.parse(sessionData),
                purchased: true //Confirming the purchase
            };
            await redis.set(`session:${sessionToken}`, JSON.stringify(updatedSessionData), 'EX', 3600); //Resetting the expiration
            return res.status(200).json({message: 'Purchase confirmed' });
        } else{
            return res.status(404).json({error: 'Session not found' });
        }
    } catch (error) {
        console.error('Error confirming purchase:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
}