// PLACEHOLDER — replace with Termly-generated terms before launch
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | JH Studios",
  description: "Terms of Use for JH Studios / jaiquezmusic.com",
};

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-3xl font-sans text-gray-700">
        <Link
          href="/"
          className="mb-10 inline-block text-sm text-blue-600 hover:underline"
        >
          &larr; Back to Home
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">Terms of Use</h1>
        <p className="mb-8 text-sm text-gray-400">
          Last updated: April 9, 2026
        </p>

        <p className="mb-6 leading-relaxed">
          By accessing or using jaiquezmusic.com (the &ldquo;Site&rdquo;),
          operated by JHStudios, you agree to these Terms of Use. If you do not
          agree, do not use this Site.
        </p>

        <Section title="1. Eligibility">
          <p>
            You must be at least 18 years old to use this Site. By using the
            Site you represent that you meet this requirement.
          </p>
        </Section>

        <Section title="2. Use of the Site">
          <ul>
            <li>
              You may use this Site for personal, non-commercial purposes only.
            </li>
            <li>
              You are responsible for providing accurate information when
              subscribing or purchasing.
            </li>
            <li>
              You may not attempt to disrupt the Site, engage in scraping, or
              otherwise misuse our services.
            </li>
            <li>
              You may not impersonate another person or misrepresent your
              affiliation with any entity.
            </li>
          </ul>
        </Section>

        <Section title="3. Subscriptions and Email">
          <p>
            By signing up to our mailing list you agree to receive email
            communications from JHStudios. You may unsubscribe at any time via
            the link in any email we send.
          </p>
        </Section>

        <Section title="4. Purchases and Payments">
          <p>
            All purchases are processed through Stripe. By completing a
            purchase, you also agree to{" "}
            <a
              href="https://stripe.com/legal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Stripe&apos;s Terms of Service
            </a>
            . All sales are final unless otherwise stated.
          </p>
        </Section>

        <Section title="5. Intellectual Property">
          <p>
            All content on this Site — including text, images, logos, audio, and
            video — is owned by or licensed to JHStudios. You may not reproduce,
            distribute, or create derivative works from any Site content without
            prior written consent.
          </p>
        </Section>

        <Section title="6. Disclaimer of Warranties">
          <p>
            This Site is provided &ldquo;as is&rdquo; without warranties of any
            kind, express or implied. We do not guarantee that the Site will be
            uninterrupted, error-free, or free of harmful components.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, JHStudios will not be liable
            for any indirect, incidental, special, or consequential damages
            arising from your use of the Site or inability to access it.
          </p>
        </Section>

        <Section title="8. Indemnification">
          <p>
            You agree to indemnify and hold harmless JHStudios and its
            affiliates from any claims, losses, or damages arising from your use
            of the Site or violation of these Terms.
          </p>
        </Section>

        <Section title="9. Governing Law">
          <p>
            These Terms are governed by the laws of the United States. Any
            disputes will be resolved in the applicable courts.
          </p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>
            We may update these Terms at any time. The &ldquo;Last
            updated&rdquo; date above will reflect changes. Continued use of the
            Site after updates constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about these Terms?{" "}
            <a
              href="mailto:jaiquez@jaiquezmusic.com"
              className="text-blue-600 underline"
            >
              jaiquez@jaiquezmusic.com
            </a>
          </p>
        </Section>

        <p className="mt-10 text-xs text-gray-400">
          This is a placeholder document. Comprehensive, attorney-reviewed terms
          will be published before commercial launch.
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
