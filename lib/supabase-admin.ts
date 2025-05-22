// File: /lib/supabase-admin.ts

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    global: { fetch: (...args) => fetch(...args).then(r => {
      if (!r.ok) console.error('[Supabase FETCH]', r.status, r.statusText, r.url);
      return r;
    })}
  }
);

export default supabaseAdmin;
