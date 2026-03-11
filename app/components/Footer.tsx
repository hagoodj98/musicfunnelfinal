import Link from "next/link";
import Privacy from "./PrivacyOffCanvas";
import Terms from "./TermsOffCanvas";
import SocialMediaButtonGroup from "./SocialMediaGroupButton";

const Footer = () => {
  const date = new Date();
  const year = date.getFullYear();

  return (
    <footer className="border-t border-yellow/15 bg-lighterblue">
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
            <Privacy name="Privacy Policy" placement="start" /> |
            <Terms name="Terms of Use" placement="start" />
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
