import Footer from "./components/Footer";
import Script from "next/script";
import { Oswald, Caveat } from "next/font/google";
import { EmailProvider, SessionTimeProvider } from "./context/EmailContext";
import CookieConsentBanner from "./components/CookieConsentBanner";
import Providers from "./providers";
import "./globals.css";
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oswald.className} ${caveat.className} `}>
      <body
        className={` antialiased bg-[url('../public/oc-gonzalez-A-11N8ItHZo-unsplash.jpg')] bg-cover bg-no-repeat bg-center`}
      >
        <Script
          src="https://www.google.com/recaptcha/api.js"
          strategy="afterInteractive"
        />
        <Providers>
          <EmailProvider>
            <SessionTimeProvider>
              {children}
              <CookieConsentBanner />
            </SessionTimeProvider>
          </EmailProvider>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
