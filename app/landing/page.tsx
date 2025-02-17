
import CheckoutInitiator from '../components/CheckoutInitiator.client';
import SessionManagerProvider from '../components/SessionManagerProvider';
import MessageNotify from '../components/MessageNotify';

const LandingPage = () => {
  
  return (
    <div>
      {/* This client component will fetch the TTL and then render the SessionManager. This strictly relates to the vality of the session using cookies. In terms of how long this cookie is valid for and what should happen as time decreases */}
      <MessageNotify />
      <SessionManagerProvider />
      <h1>Landing Page</h1>
      {/*This regards the stripe form. This component is what redirects the user to the appropriate page after the checkout. */}
      <CheckoutInitiator />
      <p>All content goes here</p>
    </div>
  )
}

export default LandingPage;
