import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ProfileContextType {
  profile: string | null;
  setProfile: (profile: string | null) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('reflecta_profile');
    if (stored) setProfile(stored);
  }, []);

  useEffect(() => {
    if (profile) {
      sessionStorage.setItem('reflecta_profile', profile);
    }
  }, [profile]);
  
  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = (): ProfileContextType => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileContext must be used within ProfileProvider');
  return ctx;
};