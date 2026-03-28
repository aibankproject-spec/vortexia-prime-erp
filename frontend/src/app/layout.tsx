import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vortexia Prime Trading | Oil & Gas ERP',
  description: 'Enterprise Resource Planning Platform for Oil & Gas Industrial Automation Solutions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
