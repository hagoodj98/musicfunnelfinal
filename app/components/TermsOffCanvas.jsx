'use client';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';

function TermsOffCanvas({name, placement}) {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div >
            <Button variant='link' 
                style={{ 
                    color: 'white',
                }}  onClick={handleShow} className="me-2  custom-footer-button">{name}
            </Button>
            <Offcanvas show={show} onHide={handleClose} placement={placement}>
                <Offcanvas.Header className='tw-bg-lighterblue tw-text-white' closeVariant='white' closeButton>
                <Offcanvas.Title> <span className='tw-text-red tw-font-header'>{name}</span></Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className='tw-bg-lighterblue tw-text-white'>
                    <h3 className='tw-font-header'>Last Updated: 03/25/2025</h3>
                    <h3 className='tw-font-header'>1. Acceptance of Terms</h3>
                    <p>By accessing or using jaiquezmuzic.com (the “Site”), you agree to these Terms of Service (“Terms”). If you do not agree, please do not use the Site.</p>
                    <h3 className='tw-font-header'>2. Eligibility</h3>
                    <p>You must be at least 18 years old (or the age of majority in your jurisdiction) to use our Services. By using the Site, you represent that you have the legal capacity to agree to these Terms.</p>
                    <h3 className='tw-font-header'>3. Use of the Site</h3>
                    <ul>
                        <li>• License: We grant you a limited, non-exclusive, non-transferable license to access and use our Site for personal, non-commercial purposes.</li>
                        <li>•	User Responsibilities:
                            <ul>
                                <li>	•	You are responsible for providing accurate information when subscribing or making purchases.</li>
                                <li>	•	You must keep your session credentials secure. Any activity under your account is your responsibility.</li>
                            </ul>
                        </li>
                        <li>	•	Prohibited Actions:
                            <ul>
                                <li>•	Do not attempt to disrupt the Site’s functionality, engage in data scraping, or otherwise misuse our Services.</li>
                            </ul>
                        </li>
                    </ul>
                    <h3 className='tw-font-header'>4. Subscription and Payment</h3>
                    <ul>
                        <li >	•	Subscriptions:
                            <ul>
                                <li>	•	By subscribing, you agree to receive communications (such as emails from Mailchimp) related to our services.</li>
                                <li>•	Your subscription status is managed via secure tokens stored in Redis.</li>
                            </ul>
                        </li>
                        <li>	•	Payments:
                            <ul>
                                <li>•	All purchases are processed through Stripe. By making a payment, you agree to Stripe’s terms in addition to these Terms.</li>
                            </ul>
                        </li>
                    </ul>
                    <h3 className='tw-font-header'>5. Intellectual Property</h3>
                    <p>All content on the Site—including text, images, logos, and other materials—is owned by or licensed to [Your Site Name]. You may not reproduce or distribute any part of the Site without our prior written consent.</p>
                    <h3 className='tw-font-header'>6. Disclaimers and Limitation of Liability</h3>
                    <ul>
                        <li>		•	Disclaimer:
                            <ul>
                                <li>•	The Site is provided “as is” without warranties of any kind. We do not guarantee that the Site will be uninterrupted or error-free.</li>
                            </ul>
                        </li>
                        <li>	•	Limitation of Liability: 
                            <ul>
                                <li>•	In no event shall [Your Site Name] be liable for any indirect, incidental, or consequential damages arising from your use of the Site.</li>
                            </ul>
                        </li>
                    </ul>
                    <h3 className='tw-font-header'>7. Indemnification</h3>
                    <p>You agree to indemnify and hold harmless [Your Site Name] and its affiliates from any claims, damages, or losses resulting from your use of the Site or violation of these Terms.</p>

                    <h3 className='tw-font-header'>8. Governing Law</h3>
                    <p>These Terms are governed by the laws of [Your Jurisdiction]. Any disputes shall be resolved in the courts of [Your Jurisdiction].</p>
                    <h3 className='tw-font-header'>9. Changes to These Terms</h3>
                    <p>We may update these Terms from time to time. Your continued use of the Site following any changes constitutes your acceptance of the new Terms.</p>
                    <h3 className='tw-font-header'>10. Contact Information</h3>
                    <p>For any questions regarding these Terms, please contact us at: Email: jaiquezmanage98@gmail.com</p>
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
}

export default TermsOffCanvas;