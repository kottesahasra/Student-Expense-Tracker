const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn('[Supabase Config] SUPABASE_URL or SUPABASE_ANON_KEY is not set in environment variables.');
}

// Public / Anonymous client
const supabaseClient = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_ANON_KEY || 'placeholder-anon-key'
);

// Admin / Service Role client (optional, for elevated backend operations)
const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

/**
 * Creates an authenticated Supabase client for a given user JWT token.
 * This preserves RLS policies defined in PostgreSQL.
 */
function getScopedClient(jwtToken) {
  if (!jwtToken) return supabaseClient;
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`
      }
    }
  });
}

module.exports = {
  supabase: supabaseClient,
  supabaseAdmin,
  getScopedClient
};

