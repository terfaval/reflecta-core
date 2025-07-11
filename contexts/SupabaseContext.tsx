import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

const SupabaseContext = createContext(supabase);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => (
  <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>
);

export const useSupabase = () => useContext(SupabaseContext);