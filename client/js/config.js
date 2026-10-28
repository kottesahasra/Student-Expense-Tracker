const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api',
  SUPABASE_URL: 'https://qmiulkhgkocibmgyqdng.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_EG9FL8DH7g2g4CXo_T7P5g_ccHneJSP',
  DEFAULT_CURRENCY: 'USD',
  STORAGE_KEYS: {
    TOKEN: 'set_token',
    USER: 'set_user',
    PROFILE: 'set_profile'
  }
};

window.CONFIG = CONFIG;

