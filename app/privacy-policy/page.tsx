// PLACEHOLDER — replace with Termly-generated policy before launch
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | JH Studios",
  description: "Privacy Policy for JH Studios / jaiquezmusic.com",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-3xl font-sans text-gray-700">
        <Link
          href="/"
          className="mb-10 inline-block text-sm text-blue-600 hover:underline"
        >
          &larr; Back to Home
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Privacy Policy
        </h1>
        <p className="mb-8 text-sm text-gray-400">
          Last updated: April 9, 2026
        </p>

        <p className="mb-6 leading-relaxed">
          JHStudios (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;)
          operates jaiquezmusic.com. This Privacy Policy explains what personal
          information we collect, how we use it, and your rights regarding that
          information.
        </p>

        <Section title="1. Information We Collect">
          <p>We may collect the following personal information:</p>
          <ul>
            <li>
              <strong>Name and email address</strong> — when you subscribe to
              our mailing list.
            </li>
            <li>
              <strong>Mailing and billing address</strong> — when you complete a
              purchase.
            </li>
            <li>
              <strong>Payment details</strong> — processed securely by Stripe.
              We never store card numbers on our servers.
            </li>
            <li>
              <strong>Usage and device data</strong> — IP address, browser type,
              pages visited, collected automatically via cookies and analytics
              tools.
            </li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul>
            <li>To send you updates, music news, and promotional content.</li>
            <li>To process and fulfill your orders.</li>
            <li>To maintain and improve the security of this site.</li>
            <li>To comply with applicable laws.</li>
          </ul>
        </Section>

        <Section title="3. Third-Party Services">
          <p>We share data with trusted service providers as needed:</p>
          <ul>
            <li>
              <strong>Mailchimp</strong> — email list management
            </li>
            <li>
              <strong>Stripe</strong> — payment processing (
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Stripe Privacy Policy
              </a>
              )
            </li>
          </ul>
          <p>We do not sell your personal information to any third party.</p>
        </Section>

        <Section title="4. Cookies">
          <p>
            We use cookies and similar technologies to maintain sessions,
            remember preferences, and analyze site traffic. You can disable
            cookies in your browser settings, though some features may not work
            as expected.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your information only as long as necessary to provide our
            services or as required by law. Session data expires automatically.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p>
            Depending on your location you may have the right to access,
            correct, or delete your personal data, or to withdraw consent at any
            time. To make a request, contact us at:
          </p>
          <p>
            <a
              href="mailto:jaiquez@jaiquezmusic.com"
              className="text-blue-600 underline"
            >
              jaiquez@jaiquezmusic.com
            </a>
          </p>
        </Section>

        <Section title="7. Children">
          <p>
            This site is not directed at children under 18. We do not knowingly
            collect data from minors.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>
            We may update this policy periodically. The &ldquo;Last
            updated&rdquo; date at the top will reflect any changes. Continued
            use of the site after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Questions about this policy?{" "}
            <a
              href="mailto:jaiquez@jaiquezmusic.com"
              className="text-blue-600 underline"
            >
              jaiquez@jaiquezmusic.com
            </a>
          </p>
        </Section>

        <p className="mt-10 text-xs text-gray-400">
          This is a placeholder policy. A comprehensive, attorney-reviewed
          privacy policy will be published before commercial launch.
        </p>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold text-gray-800">{title}</h2>
      <div className="space-y-3 leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}
