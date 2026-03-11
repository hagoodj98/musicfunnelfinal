'use client';

import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';

const LandingToastNotifier = () => {
  const searchParams = useSearchParams();
  useEffect(() => {
    const msg = searchParams.get('msg');
    
    if (msg) {
      toast.info(decodeURIComponent(msg));
      // Optionally, remove the query parameter from the URL so the toast doesn't reappear
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  return null;
};

export default LandingToastNotifier;