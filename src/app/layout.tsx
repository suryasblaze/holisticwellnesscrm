import { Toaster } from 'react-hot-toast';
import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wellness Platform CRM',
  description: 'Comprehensive wellness platform management CRM',
  keywords: ['wellness', 'holistic health', 'healing', 'meditation', 'courses'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} antialiased`}>
      <body className="min-h-screen bg-orbitly-light-green text-orbitly-charcoal">
        <Providers>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#2F3334', // Orbitly charcoal
                color: '#E8EEE8', // Orbitly light green
              },
              success: {
                iconTheme: {
                  primary: '#16a34a', // Primary green
                  secondary: '#E8EEE8',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444', // Red-500
                  secondary: '#E8EEE8',
                },
              },
            }} 
          />
          {children}
        </Providers>
      </body>
    </html>
  );
} 