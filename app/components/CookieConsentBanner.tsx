"use client";

import { useState, useEffect } from "react";
import Metafooter from "./Metafooter";
/**
 * 
 * 	•	useEffect Check: On mount, the component checks localStorage for the “cookieConsent” flag. If it’s not set, the banner is shown.
	•	Consent Handler: Clicking the button sets a flag in localStorage and hides the banner.
	•	Tailwind Styling: The banner is styled with Tailwind classes. It’s fixed to the bottom, has a dark background, and includes a “Learn more” link pointing to the privacy policy.
 */

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if the consent flag is stored in localStorage
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleConsent = () => {
    localStorage.setItem("cookieConsent", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 flex flex-col sm:flex-row items-center justify-between z-50">
      <span className="text-sm">
        By continuing to browse this site, you consent to our use of cookies to
        ensure the functionality of the site and to enhance your user
        experience. For more information, please see our{" "}
        <span className="inline-block">
          <Metafooter name="Privacy Policy" placement="left">
            <h3 className="font-header">Last Updated: 03/25/2025</h3>
            <h3 className="font-header">1. Introduction</h3>
            <p>
              Welcome to jaiquezmusic.com (referred to as &quot;we,&quot;
              &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains
              how we collect, use, store, and share your personal information
              when you use our website and services (the &quot;Services&quot;).
              Our aim is to protect your privacy while providing you with an
              engaging music fan experience.
            </p>
            <h3 className="font-header">2. Information We Collect</h3>
            <h4 className="font-header">Personal Information:</h4>
            <ul>
              <li>
                • Subscription Details: When you sign up via our subscription
                form, we collect your name, email address, and an optional
                &quot;remember me&quot; preference.
              </li>
              <li>
                • Payment Information: For users completing a purchase, we use
                Stripe to handle payments. We do not store full credit card
                details on our servers.
              </li>
            </ul>
            <h4 className="font-header">Usage Data:</h4>
            <ul>
              <li>
                • Session Data: We generate session tokens and CSRF tokens that
                are stored in Redis and managed via secure cookies.
              </li>
              <li>
                • Cookies: Our website uses cookies to track session information
                and to provide a personalized user experience.
              </li>
            </ul>
            <h3 className="font-header">3. How We Use Your Information</h3>
            <ul>
              <li>
                • Providing the Service: We use your personal data to subscribe
                you to our mailing list via Mailchimp and to manage your session
                securely.
              </li>
              <li>
                • Payments: Stripe is used to process any purchases or checkout
                sessions.
              </li>
              <li>
                • Security and Session Management: We create, update, and
                refresh sessions using tokens stored in Redis.
              </li>
              <li>
                • Communication: We may send you updates, promotional emails, or
                notifications about your account or subscription status.
              </li>
            </ul>
            <h3 className="font-header">4. Sharing and Disclosure</h3>
            <ul>
              <li>• Mailchimp: To manage email subscriptions and updates.</li>
              <li>• Stripe: For secure payment processing.</li>
              <li>
                • Redis: To manage session data (stored securely, not shared
                with third parties).
              </li>
              <li>
                • Legal Requirements: We may disclose your information if
                required by law or to protect our rights.
              </li>
            </ul>
            <h3 className="font-header">5. Data Retention</h3>
            <p>
              We retain your personal information for as long as necessary to
              provide our Services or as required by law. Session data stored in
              Redis expires automatically based on your &quot;remember me&quot;
              selection (either about 1 hour or up to 1 week).
            </p>
            <h3 className="font-header">6. Your Rights</h3>
            <ul>
              <li>
                • Access and Update: You may request access to, correction of,
                or deletion of your personal data by contacting us at
                jaiquez@jaiquezmusic.com.
              </li>
              <li>
                • Opt-Out: You can unsubscribe from marketing emails at any time
                by using the unsubscribe link in our communications.
              </li>
            </ul>
            <h3 className="font-header">7. Security</h3>
            <p>
              We implement reasonable security measures to protect your data.
              However, no system is completely secure, and we cannot guarantee
              absolute security.
            </p>
            <h3 className="font-header">8. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy periodically. The updated
              version will be posted on this page with a new &quot;Last
              Updated&quot; date.
            </p>
            <h3 className="font-header">9. Contact Us</h3>
            <p>
              If you have any questions or concerns, please contact us at:
              Email: jaiquez@jaiquezmusic.com
            </p>
          </Metafooter>
        </span>
      </span>
      <button
        onClick={handleConsent}
        className="mt-2 sm:mt-0 bg-blue-500 hover:bg-secondary text-white text-sm font-medium px-4 py-2 rounded"
      >
        Understood
      </button>
    </div>
  );
};

export default CookieConsentBanner;
