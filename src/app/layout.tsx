import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { textos } from '@/textos';

export const metadata: Metadata = {
  title: textos.app.titulo,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
