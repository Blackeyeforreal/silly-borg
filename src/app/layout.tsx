import type { Metadata } from 'next';
import { Instrument_Serif, IBM_Plex_Sans, IBM_Plex_Mono, EB_Garamond } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif-display',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SillyBorg Atelier — Typographic Resume Studio',
  description: 'Editorial-grade resume typesetting and targeted career document studio.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${ibmPlexSans.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable} ${ebGaramond.variable} font-sans antialiased bg-[#F8F7F4] text-[#141413] min-h-full selection:bg-[#141413] selection:text-[#F8F7F4]`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
