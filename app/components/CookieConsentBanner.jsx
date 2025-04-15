'use client';

import { useState, useEffect } from "react";
import Privacy from './PrivacyOffCanvas';
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
    <div className="tw-fixed tw-bottom-0 tw-left-0 tw-right-0 tw-bg-gray-800 tw-text-white tw-p-4 tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-between tw-z-50">
      <span className="text-sm">By continuing to browse this site, you consent to our use of cookies to ensure the functionality of the site and to enhance your user experience. For more information, please see our <span className="tw-inline-block"><Privacy className="tw-underline" name= 'Privacy Policy' placement='start'/></span>
      </span>
      <button 
        onClick={handleConsent} 
        className="tw-mt-2 sm:tw-mt-0 tw-bg-blue-500 hover:tw-bg-secondary tw-text-white tw-text-sm tw-font-medium tw-px-4 tw-py-2 tw-rounded"
      >
        Understood
      </button>
    </div>
  );
};

export default CookieConsentBanner;