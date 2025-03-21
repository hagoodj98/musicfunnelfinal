import type { Metadata } from "next";
import Footer from './components/Footer';
import Script from "next/script";
import "./globals.css";
import localFont from 'next/font/local';
import "bootstrap/dist/css/bootstrap.min.css";
import 'react-toastify/dist/ReactToastify.css';
import Providers from "./providers";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Oswald, Caveat } from "next/font/google";

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-oswald'
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-caveat'
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={` antialiased tw-bg-[url('../public/oc-gonzalez-A-11N8ItHZo-unsplash.jpg')] tw-bg-cover tw-bg-no-repeat tw-bg-center`}>
       {/* This loads the reCAPTCHA script once the page is interactive. The src="https://www.google.com/recaptcha/api.js" loads the reCAPTCHA script and this ensures the reCAPTCHA API is loaded on your pages, and then the <div className="g-recaptcha" ...> in the FindMe component will work correctly.. The strategy="afterInteractive" ensures the script is fetched and executed after the page is interactive (which is typically what you want for non-critical scripts). */}
        <ToastContainer />
        <Script src="https://www.google.com/recaptcha/api.js"
          strategy="afterInteractive"/>
          <Providers>
            {children}
          </Providers>
          <Footer />
      </body>
    </html>
  );
}
