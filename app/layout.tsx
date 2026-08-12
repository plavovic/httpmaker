import type { Metadata } from 'next';
import './globals.css';
import { SmoothScroll } from '@/components/SmoothScroll';

export const metadata: Metadata = {
  title: 'HTTPMAKER',
  description: 'HTTPMAKER - Generate your website.',
  applicationName: 'HTTPMAKER',
  openGraph: {
    title: 'HTTPMAKER',
    description: 'HTTPMAKER - Generate your website.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'HTTPMAKER',
    description: 'HTTPMAKER - Generate your website.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
