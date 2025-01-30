
// Example for a disconnect handler in Next.js
export async function POST(req) {
    // Implement your logic for when a WebSocket connection is disconnected
    console.log('WebSocket disconnected', req);
    return new Response(JSON.stringify({message: 'Disconnected successfully'}), {status: 200 });
  }