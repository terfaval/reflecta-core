// File: /pages/_app.tsx

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { UserProvider } from '@/contexts/UserContext';
import { ProfileProvider } from '@/contexts/ProfileContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ProfileProvider>
        <Component {...pageProps} />
      </ProfileProvider>
    </UserProvider>
  );
}
