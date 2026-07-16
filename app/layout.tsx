import { AuthSessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Braka Storage',
  description: 'Internal file storage platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <Toaster position="bottom-right" />
        <AuthSessionProvider>
          <ThemeProvider attribute="class">{children}</ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
