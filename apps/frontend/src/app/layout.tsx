import { Roboto } from 'next/font/google';
import { Header } from '../components/Header';
import { Providers } from '../components/Providers';
import '../app/globals.css';

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata = {
  title: 'VeriFlow | Secure Document Verification',
  description: 'Streamlined identity and document verification gateway.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body className={`${roboto.className} antialiased min-h-screen bg-slate-50 text-slate-900`}>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
