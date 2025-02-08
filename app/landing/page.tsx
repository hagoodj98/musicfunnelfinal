
import ClientInteractiveLanding from '../components/ClientInteractiveLanding';
import CheckoutInitiator from '../components/CheckoutInitiator.client';
import RememberMe from '../components/RememberMe';



const LandingPage = () => {
  //Set a 5-minute checkout window (300 seconds)

  return (
    <div>
      <h1>Landing Page</h1>
      {/* The interactive elements (timer, remember me, Stripe form) are handled client-side */}
      <ClientInteractiveLanding />
      {/* Render the client component that contains the "Buy" button */}
      <CheckoutInitiator rememberMe={RememberMe} />
      <p>All content goes here</p>
    </div>
  )
}

export default LandingPage;
