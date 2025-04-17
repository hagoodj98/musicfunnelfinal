import Footer from './components/Footer';
import Script from "next/script";
import { Oswald, Caveat } from 'next/font/google';
import { EmailProvider } from './context/EmailContext';
import EmailPollingManager from './components/EmailPollingManager';
import Redirect from './components/Redirect';
import CookieConsentBanner from './components/CookieConsentBanner';
import 'react-toastify/dist/ReactToastify.css';
import Providers from "./providers";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '700'],
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oswald.className} ${caveat.className} `}>
      <body className={` antialiased tw-bg-[url('../public/oc-gonzalez-A-11N8ItHZo-unsplash.jpg')] tw-bg-cover tw-bg-no-repeat tw-bg-center`}>
       
          <ToastContainer />
          <Script src="https://www.google.com/recaptcha/api.js"
            strategy="afterInteractive"/>
          <Providers>
            <EmailProvider>
              {children}
              <Redirect />
              <CookieConsentBanner />
            </EmailProvider>
          </Providers>
          <Footer />
       
      </body>
    </html>
  );
}
