// File: /pages/_app.tsx

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { UserProvider } from '@/contexts/UserContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastProvider } from '@/contexts/ToastContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <ProfileProvider>
        <UserProvider>
          <SessionProvider>
            <Component {...pageProps} />
          </SessionProvider>
        </UserProvider>
      </ProfileProvider>
    </ToastProvider>
  );
}
