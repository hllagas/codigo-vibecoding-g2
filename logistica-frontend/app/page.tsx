import type { Metadata } from 'next';
import { Lexend, Source_Sans_3 } from 'next/font/google';
import LandingClient from './landing/LandingClient';

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Logistica Web — Logística inteligente para empresas',
  description:
    'Mueve más, gestiona menos. Tracking en tiempo real, rutas optimizadas con IA y dashboards que hablan tu idioma.',
};

export default function HomePage() {
  return (
    <div className={`${lexend.variable} ${sourceSans.variable}`}>
      <LandingClient />
    </div>
  );
}
