"use client";

import { useState, useEffect } from "react";
import Privacy from "./PrivacyOffCanvas";
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
          <Privacy name="Privacy Policy" placement="left" />
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
