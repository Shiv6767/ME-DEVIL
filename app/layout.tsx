import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'MangaNexus | Discover Your Next Favorite Manga',
  description: 'A comprehensive manga library and recommendation engine.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} dark`} style={{ colorScheme: 'dark' }}>
      <body className="bg-[#0b1622] text-[#9fadbd] min-h-screen font-sans selection:bg-[#3db4f2]/30 selection:text-[#3db4f2] flex flex-col" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1 flex flex-col pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
