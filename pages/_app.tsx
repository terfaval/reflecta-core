// File: /pages/_app.tsx

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { UserProvider } from '@/contexts/UserContext'; // 👈 ezt hozzáadjuk

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider> {/* 👈 itt csomagoljuk be */}
      <Component {...pageProps} />
    </UserProvider>
  );
}
