// File: /pages/_app.tsx

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { UserProvider } from '@/contexts/UserContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ProfileProvider>
        <Component {...pageProps} />
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
      </ProfileProvider>
    </UserProvider>
  );
}
