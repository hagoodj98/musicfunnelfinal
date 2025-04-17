'use client';

import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';

let hasToastShown = false;

const LandingToastNotifier = () => {
  const searchParams = useSearchParams();
  const hasShown = useRef(false);
  const msg = searchParams.get('msg');

  useEffect(() => {
   
    if (msg && !hasShown.current) {
      hasShown.current = true;
      toast.info(decodeURIComponent(msg));
      // Remove the query parameter so the toast doesn't reappear
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [msg]);

  return null;
};

export default LandingToastNotifier;