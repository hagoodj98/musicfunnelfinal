//This message hits the API Gateway first, which routes the message based on the action field in the message payload. If no specific route matches (like for custom actions that I haven’t explicitly set up as individual routes in the Gateway), the $default route is used which is this file. The $default route in API Gateway forwards this message to my backend endpoint (the default handler in my application). My backend, which receives this routed request, processes it based on the action. This could involve logging the heartbeat, updating database records, handling checkout processes, etc.

import redis from "../../utils/redis";

export async function POST(req) {

    const { action, wsToken } = await req.json();
    if (action === "checkoutInitiatedAuth") {
        const sessionToken = await redis.get(`wsToken:${wsToken}`);
        if (!sessionToken) {
            console.error("WebSocket Authentication Failed: Invalid or expired wsToken");
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        const { connectionId } = req.headers; //// Get WebSocket connection ID from API Gateway
        await redis.set(`ws:${sessionToken}`, connectionId, "EX", 3600);

        return new Response(JSON.stringify({ message: "WebSocket authentication successful" }), { status: 200 });
    }

    try {
        switch (action) {
           
            case 'checkoutInitiatedAuth':
                // Handle heartbeat action
                console.log(`Heartbeat received for session: ${sessionToken}`);
                // Possibly update session activity in the database
                break;
            case 'checkoutAborted':
                // Handle heartbeat action
                console.log(`Heartbeat received for session: ${sessionToken}`);
                // Possibly update session activity in the database
                break;
            case 'checkoutFailed':
                // Handle heartbeat action
                console.log(`Heartbeat received for session: ${sessionToken}`);
                // Possibly update session activity in the database
                break;
        
            default:
                console.log(`Received unknown action: ${action}`);
                // Handle unknown or unspecified action
                break;
        }
        return new Response(JSON.stringify({message: 'Action processed successfully'}), {status: 200});
    } catch (error) {
        console.error(`Error processing action${action}:`, error);
        return new Response(JSON.stringify({}), {status:500})
    }
}