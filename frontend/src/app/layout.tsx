import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Azure Mini Tasks | GitHub to Azure Lab',
  description: 'A small full-stack demo: Next.js, NestJS, Prisma, MySQL and GitHub Actions.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
