import Link from "next/link";
import SocialMediaButtonGroup from "./SocialMediaGroupButton";
import Metafooter from "./Metafooter";

const Footer = () => {
  const date = new Date();
  const year = date.getFullYear();

  return (
    <footer className=" border-t border-yellow/15 bg-lighterblue">
      <div className="container mx-auto flex flex-col gap-8 px-6 py-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <p className="font-header text-xs uppercase tracking-[0.16em] text-yellow/90 sm:text-sm">
            Official Artist Community
          </p>
          <Link
            className="font-body text-4xl leading-none text-white no-underline transition hover:text-yellow"
            href="/"
          >
            @JH Studios
          </Link>
          <p className="mt-3 font-header text-sm text-yellow/85 sm:text-base">
            Copyright &copy; {year}. All Rights Reserved.
          </p>
        </div>

        <div className="flex flex-col items-center text-center md:items-end md:text-right">
          <p className="font-header text-xs uppercase tracking-[0.14em] text-yellow/90 sm:text-sm">
            Legal
          </p>
          <div className="mt-2 flex items-center font-header text-base text-white sm:text-lg">
            <Metafooter name="Privacy Policy" placement="left">
              <div className="bg-lighterblue text-white">
                <h3 className="font-header">Last Updated: 03/25/2025</h3>
                <h3 className="font-header">1. Introduction</h3>
                <p>
                  Welcome to jaiquezmusic.com (referred to as “we,” “our,” or
                  “us”). This Privacy Policy explains how we collect, use,
                  store, and share your personal information when you use our
                  website and services (the “Services”). Our aim is to protect
                  your privacy while providing you with an engaging music fan
                  experience.
                </p>
                <h3 className="font-header">2. Information We Collect</h3>

                <h4 className="font-header">Personal Information:</h4>
                <ul>
                  <li>
                    • Subscription Details: When you sign up via our
                    subscription form, we collect your name, email address, and
                    an optional “remember me” preference.
                  </li>
                  <li>
                    • Payment Information: For users completing a purchase, we
                    use Stripe to handle payments. We do not store full credit
                    card details on our servers.
                  </li>
                </ul>
                <h4 className="font-header">Usage Data:</h4>
                <ul>
                  <li>
                    • Session Data: We generate session tokens and CSRF tokens
                    that are stored in Redis and managed via secure cookies.
                  </li>
                  <li>
                    • Cookies: Our website uses cookies to track session
                    information and to provide a personalized user experience.
                  </li>
                </ul>

                <h3 className="font-header">3. How We Use Your Information</h3>
                <ul>
                  <li>
                    • Providing the Service: We use your personal data to
                    subscribe you to our mailing list via Mailchimp and to
                    manage your session securely.
                  </li>
                  <li>
                    • Payments: Stripe is used to process any purchases or
                    checkout sessions.
                  </li>
                  <li>
                    • Security and Session Management: We create, update, and
                    refresh sessions using tokens stored in Redis. This ensures
                    that only authenticated and subscribed users can access
                    protected areas.
                  </li>
                  <li>
                    • Communication: We may send you updates, promotional
                    emails, or notifications about your account or subscription
                    status.
                  </li>
                </ul>
                <h3 className="font-header">4. Sharing and Disclosure</h3>
                <ul>
                  <li>• Third-Party Service Providers:</li>
                  <li>
                    • Mailchimp: To manage email subscriptions and updates.
                  </li>
                  <li>• Stripe: For secure payment processing.</li>
                  <li>
                    • Redis: To manage session data (this data is stored
                    securely on our servers and not shared with third parties).
                  </li>
                  <li>
                    {" "}
                    • Legal Requirements: We may disclose your information if
                    required by law or to protect our rights.
                  </li>
                </ul>
                <h3 className="font-header">5. Data Retention</h3>
                <p>
                  We retain your personal information for as long as necessary
                  to provide our Services or as required by law. Session data
                  stored in Redis expires automatically based on your “remember
                  me” selection (either about 1 hour or up to 1 week).
                </p>
                <h3 className="font-header">6. Your Rights</h3>
                <ul>
                  <li>
                    {" "}
                    • Access and Update: You may request access to, correction
                    of, or deletion of your personal data by contacting us at
                    [Your Contact Email].
                  </li>
                  <li>
                    • Opt-Out: You can unsubscribe from marketing emails at any
                    time by using the unsubscribe link in our communications.
                  </li>
                </ul>
                <h3 className="font-header">7. Security</h3>
                <p>
                  We implement reasonable security measures to protect your
                  data. However, no system is completely secure, and we cannot
                  guarantee absolute security.
                </p>

                <h3 className="font-header">8. Changes to This Policy</h3>
                <p>
                  We may update this Privacy Policy periodically. The updated
                  version will be posted on this page with a new “Last Updated”
                  date.
                </p>
                <h3 className="font-header">9. Contact Us</h3>
                <p>
                  If you have any questions or concerns regarding this Privacy
                  Policy, please contact us at: Email: jaiquezmanage98@gmail.com
                </p>
              </div>
            </Metafooter>
            <Metafooter name="Terms of Use" placement="left">
              <div className="bg-lighterblue text-white">
                <h3 className="font-header">Last Updated: 03/25/2025</h3>
                <h3 className="font-header">1. Acceptance of Terms</h3>
                <p>
                  By accessing or using jaiquezmusic.com (the “Site”), you agree
                  to these Terms of Service (“Terms”). If you do not agree,
                  please do not use the Site.
                </p>
                <h3 className="font-header">2. Eligibility</h3>
                <p>
                  You must be at least 18 years old (or the age of majority in
                  your jurisdiction) to use our Services. By using the Site, you
                  represent that you have the legal capacity to agree to these
                  Terms.
                </p>
                <h3 className="font-header">3. Use of the Site</h3>
                <ul>
                  <li>
                    • License: We grant you a limited, non-exclusive,
                    non-transferable license to access and use our Site for
                    personal, non-commercial purposes.
                  </li>
                  <li>
                    • User Responsibilities:
                    <ul>
                      <li>
                        {" "}
                        • You are responsible for providing accurate information
                        when subscribing or making purchases.
                      </li>
                      <li>
                        {" "}
                        • You must keep your session credentials secure. Any
                        activity under your account is your responsibility.
                      </li>
                    </ul>
                  </li>
                  <li>
                    {" "}
                    • Prohibited Actions:
                    <ul>
                      <li>
                        • Do not attempt to disrupt the Site’s functionality,
                        engage in data scraping, or otherwise misuse our
                        Services.
                      </li>
                    </ul>
                  </li>
                </ul>
                <h3 className="font-header">4. Subscription and Payment</h3>
                <ul>
                  <li>
                    {" "}
                    • Subscriptions:
                    <ul>
                      <li>
                        {" "}
                        • By subscribing, you agree to receive communications
                        (such as emails from Mailchimp) related to our services.
                      </li>
                      <li>
                        • Your subscription status is managed via secure tokens
                        stored in Redis.
                      </li>
                    </ul>
                  </li>
                  <li>
                    {" "}
                    • Payments:
                    <ul>
                      <li>
                        • All purchases are processed through Stripe. By making
                        a payment, you agree to Stripe’s terms in addition to
                        these Terms.
                      </li>
                    </ul>
                  </li>
                </ul>
                <h3 className="font-header">5. Intellectual Property</h3>
                <p>
                  All content on the Site—including text, images, logos, and
                  other materials—is owned by or licensed to [Your Site Name].
                  You may not reproduce or distribute any part of the Site
                  without our prior written consent.
                </p>
                <h3 className="font-header">
                  6. Disclaimers and Limitation of Liability
                </h3>
                <ul>
                  <li>
                    {" "}
                    • Disclaimer:
                    <ul>
                      <li>
                        • The Site is provided “as is” without warranties of any
                        kind. We do not guarantee that the Site will be
                        uninterrupted or error-free.
                      </li>
                    </ul>
                  </li>
                  <li>
                    {" "}
                    • Limitation of Liability:
                    <ul>
                      <li>
                        • In no event shall [Your Site Name] be liable for any
                        indirect, incidental, or consequential damages arising
                        from your use of the Site.
                      </li>
                    </ul>
                  </li>
                </ul>
                <h3 className="font-header">7. Indemnification</h3>
                <p>
                  You agree to indemnify and hold harmless [Your Site Name] and
                  its affiliates from any claims, damages, or losses resulting
                  from your use of the Site or violation of these Terms.
                </p>

                <h3 className="font-header">8. Governing Law</h3>
                <p>
                  These Terms are governed by the laws of [Your Jurisdiction].
                  Any disputes shall be resolved in the courts of [Your
                  Jurisdiction].
                </p>
                <h3 className="font-header">9. Changes to These Terms</h3>
                <p>
                  We may update these Terms from time to time. Your continued
                  use of the Site following any changes constitutes your
                  acceptance of the new Terms.
                </p>
                <h3 className="font-header">10. Contact Information</h3>
                <p>
                  For any questions regarding these Terms, please contact us at:
                  Email: jaiquezmanage98@gmail.com
                </p>
              </div>
            </Metafooter>
          </div>

          <div className="mt-3">
            <SocialMediaButtonGroup />
          </div>

          <div className="mt-3 max-w-md">
            <p className="font-header text-sm leading-relaxed text-yellow/90 sm:text-base">
              For questions or support:
              <a
                href="mailto:jaiquezmanage98@gmail.com"
                className="ml-1 text-white underline underline-offset-2 transition hover:text-yellow"
              >
                jaiquezmanage98@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
