// File: /pages/_app.tsx

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { UserProvider } from '@/contexts/UserContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { MemoryProvider } from '@/contexts/MemoryContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastProvider } from '@/contexts/ToastContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <ProfileProvider>
        <UserProvider>
          <SessionProvider>
            <MemoryProvider>
              <Component {...pageProps} />
            </MemoryProvider>
          </SessionProvider>
        </UserProvider>
      </ProfileProvider>
    </ToastProvider>
  );
}
