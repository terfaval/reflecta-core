// lib/prepareProfile.ts
import supabase from '@/lib/supabase-admin';
import type { Profile } from './types';

export async function prepareProfile(profileName: string): Promise<Profile> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, prompt_core')
    .eq('name', profileName)
    .maybeSingle();

  if (!profile) throw new Error('Profile not found');

  const { data: metadata } = await supabase
    .from('profile_metadata')
    .select('*')
    .eq('profile', profileName)
    .maybeSingle();

  if (!metadata) throw new Error('Profile metadata missing');

  return {
    name: profile.name,
    prompt_core: profile.prompt_core,
    metadata,
  };
}
