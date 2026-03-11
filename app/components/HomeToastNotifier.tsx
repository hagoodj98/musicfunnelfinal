// app/components/HomeToastNotifier.tsx
'use client';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSearchParams, usePathname } from 'next/navigation';

export default function HomeToastNotifier() {
  const params = useSearchParams();
  const path = usePathname();
  const msg = params.get('msg');

  useEffect(() => {
    if (path === '/' && msg) {
      toast.info(decodeURIComponent(msg));
      // remove it so it never shows again
      window.history.replaceState({}, '', path);
    }
  }, [path, msg]);

  return null;
}