import Footer from "./components/Footer";
import Script from "next/script";
import { Oswald, Caveat } from "next/font/google";
import { EmailProvider } from "./context/EmailContext";
//import Redirect from "./components/Redirect";
import CookieConsentBanner from "./components/CookieConsentBanner";
import Providers from "./providers";
import { ToastContainer } from "react-toastify";
import "./globals.css";
import Redirect from "./components/Redirect";
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oswald.className} ${caveat.className} `}>
      <body
        className={`antialiased bg-[url('../public/oc-gonzalez-A-11N8ItHZo-unsplash.jpg')] bg-cover bg-no-repeat bg-center`}
      >
        <ToastContainer />
        <Script
          src="https://www.google.com/recaptcha/api.js"
          strategy="afterInteractive"
        />
        <Providers>
          <EmailProvider>
            <Redirect />
            {children}

            <CookieConsentBanner />
          </EmailProvider>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
