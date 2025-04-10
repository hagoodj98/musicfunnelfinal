'use client';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';


function PrivacyOffCanvas({name, placement}) {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div >
            <Button variant='link' 
                style={{ 
                    color: 'white',
                }}  onClick={handleShow} className=" me-2 custom-footer-button">{name}
            </Button>
            <Offcanvas show={show} onHide={handleClose}  placement={placement}>
                <Offcanvas.Header className='tw-bg-lighterblue tw-text-white' closeVariant='white' closeButton>
                <Offcanvas.Title> <span className='tw-font-header  tw-text-white'>{name}</span></Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className='tw-bg-lighterblue tw-text-white'>
                    <h3 className='tw-font-header'>Last Updated: 03/25/2025</h3>
                    <h3 className='tw-font-header'>1. Introduction</h3>
                    <p>Welcome to jaiquezmuzic.com (referred to as “we,” “our,” or “us”). This Privacy Policy explains how we collect, use, store, and share your personal information when you use our website and services (the “Services”). Our aim is to protect your privacy while providing you with an engaging music fan experience.</p>
                    <h3 className='tw-font-header'>2. Information We Collect</h3>

                    <h4 className='tw-font-header'>Personal Information:</h4>
                    <ul>
                        <li>•	Subscription Details: When you sign up via our subscription form, we collect your name, email address, and an optional “remember me” preference.</li>
                        <li>•	Payment Information: For users completing a purchase, we use Stripe to handle payments. We do not store full credit card details on our servers.</li>
                    </ul>
                    <h4 className='tw-font-header'>Usage Data:</h4>
                    <ul>
                        <li>•	Session Data: We generate session tokens and CSRF tokens that are stored in Redis and managed via secure cookies.</li>
                        <li>•	Cookies: Our website uses cookies to track session information and to provide a personalized user experience.</li>
                    </ul>

                    <h3 className='tw-font-header'>3. How We Use Your Information</h3>
                    <ul>
                        <li>•	Providing the Service: We use your personal data to subscribe you to our mailing list via Mailchimp and to manage your session securely.</li>
                        <li>•	Payments: Stripe is used to process any purchases or checkout sessions.</li>
                        <li>•	Security and Session Management: We create, update, and refresh sessions using tokens stored in Redis. This ensures that only authenticated and subscribed users can access protected areas.</li>
                        <li>•	Communication: We may send you updates, promotional emails, or notifications about your account or subscription status.</li>
                    </ul>
                    <h3 className='tw-font-header'>4. Sharing and Disclosure</h3>
                    <ul>
                        <li>•	Third-Party Service Providers:</li>
                        <li>•	Mailchimp: To manage email subscriptions and updates.</li>
                        <li>•	Stripe: For secure payment processing.</li>
                        <li>•	Redis: To manage session data (this data is stored securely on our servers and not shared with third parties).</li>
                        <li>	•	Legal Requirements: We may disclose your information if required by law or to protect our rights.</li>
                    </ul>
                    <h3 className='tw-font-header'>5. Data Retention</h3>
                    <p>We retain your personal information for as long as necessary to provide our Services or as required by law. Session data stored in Redis expires automatically based on your “remember me” selection (either about 1 hour or up to 1 week).</p>
                    <h3 className='tw-font-header'>6. Your Rights</h3>
                    <ul>
                        <li>	•	Access and Update: You may request access to, correction of, or deletion of your personal data by contacting us at [Your Contact Email].</li>
                        <li>•	Opt-Out: You can unsubscribe from marketing emails at any time by using the unsubscribe link in our communications.</li>
                    </ul>
                    <h3 className='tw-font-header'>7. Security</h3>
                    <p>We implement reasonable security measures to protect your data. However, no system is completely secure, and we cannot guarantee absolute security.</p>

                    <h3 className='tw-font-header'>8. Changes to This Policy</h3>
                    <p>We may update this Privacy Policy periodically. The updated version will be posted on this page with a new “Last Updated” date.</p>
                    <h3 className='tw-font-header'>9. Contact Us</h3>
                    <p>If you have any questions or concerns regarding this Privacy Policy, please contact us at:
                    Email: jaiquezmanage98@gmail.com</p>
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
}

export default PrivacyOffCanvas;