
// headersWrapper.js
export async function cookies() {
    // If we’re in a Node test environment, we’ll override this file,
    // so this code never actually runs. But just in case:
    if (process.env.NODE_ENV === 'test') {
      throw new Error("headersWrapper.js must be mocked in tests");
    }
  
    // Dynamically import next/headers at runtime.
    const { cookies: realCookies } = await import('next/headers');
    return realCookies();
  }