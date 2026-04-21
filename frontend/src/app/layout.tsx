import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScriptVerse — Plateforme de formation en ligne',
  description: 'Apprenez à votre rythme avec les meilleurs formateurs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
