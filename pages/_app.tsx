// File: /pages/_app.tsx

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { UserProvider } from '@/contexts/UserContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { SupabaseProvider } from '@/contexts/SupabaseContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <ToastProvider>
        <ProfileProvider>
          <UserProvider>
            <Component {...pageProps} />
          </UserProvider>
        </ProfileProvider>
      </ToastProvider>
    </SupabaseProvider>
  );
}
