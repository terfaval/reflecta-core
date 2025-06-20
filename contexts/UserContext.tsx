import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface UserContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
  userInitialized: boolean;
  setUserInitialized: (v: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userInitialized, setUserInitialized] = useState(false);

  useEffect(() => {
    const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || 'https://beenook.hu/reflecta';

    const handleInitUser = (event: MessageEvent) => {
      if (event.origin !== WP_ORIGIN) return;
      if (event.data?.type === 'init_user' || event.data?.type === 'wp_user') {
        const { wp_user_id, email } = event.data;
        fetch('/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wp_user_id, email })
        })
          .then(res => res.json())
          .then(({ user_id }) => {
            setUserId(user_id);
            setUserInitialized(true);
            window.parent.postMessage({ status: 'user_received' }, event.origin);
          })
          .catch(err => {
            console.error(err);
            setUserInitialized(true);
          });
      }
    };

    window.addEventListener('message', handleInitUser);
    return () => window.removeEventListener('message', handleInitUser);
  }, []);

  return (
    <UserContext.Provider value={{ userId, setUserId, userInitialized, setUserInitialized }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUserContext must be used within UserProvider');
  return context;
};
