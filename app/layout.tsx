import Footer from './components/Footer';
import Script from "next/script";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import 'react-toastify/dist/ReactToastify.css';
import Providers from "./providers";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={` antialiased tw-bg-[url('../public/oc-gonzalez-A-11N8ItHZo-unsplash.jpg')] tw-bg-cover tw-bg-no-repeat tw-bg-center`}>
      
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
