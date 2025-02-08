
import ClientStripeRedirect from './StripeRedirect.client';

export default async function StripeForm({ rememberMe }) {
    // I am making the API call on the server to create a checkout session because its good practice to keep business logic away from the client, including cookies and tokens

   // Retrieve CSRF token securely from server-side cookies
    const cookieStore = cookies();
    const csrfToken = cookieStore.get('csrfToken')?.value || ''; //Get CSRF from cookies

    const res = await fetch(`/api/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'CSRF-Token': csrfToken, //Include CSRF token in request 
      },
      body: JSON.stringify({ rememberMe })
    });
  
    if (!res.ok) {
      // If there was an error creating the session, you can render an error message.
      return <div>Error creating checkout session. Please try again later.</div>;
    }
    //When successful, it parses the session and passes the session ID to the client component ClientStripeRedirect.
    const session = await res.json();
  
    // Render a client component that will handle the redirect to Stripe.
    return <ClientStripeRedirect sessionId={session.id} />;
  }