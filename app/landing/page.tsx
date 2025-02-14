
import CheckoutInitiator from '../components/CheckoutInitiator.client';
import SessionManager from '../components/SessionManager';


const LandingPage = () => {
  //Set a 5-minute checkout window (300 seconds)

  return (
    <div>
      <SessionManager  />
      <h1>Landing Page</h1>
      <CheckoutInitiator />
      <p>All content goes here</p>
    </div>
  )
}

export default LandingPage;
