
import CheckoutInitiator from '../components/CheckoutInitiator.client';
import SessionManagerProvider from '../components/SessionManagerProvider';

const LandingPage = () => {
  
  return (
    <div>
      {/* This client component will fetch the TTL and then render the SessionManager */}
      <SessionManagerProvider />
      <h1>Landing Page</h1>
      <CheckoutInitiator />
      <p>All content goes here</p>
    </div>
  )
}

export default LandingPage;
