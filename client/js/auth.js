const Auth = {
  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
  },

  getUser() {
    const userStr = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getProfile() {
    const profileStr = localStorage.getItem(CONFIG.STORAGE_KEYS.PROFILE);
    try {
      return profileStr ? JSON.parse(profileStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },

  async syncSupabaseSession(session) {
    if (window.sbClient && session?.access_token && session?.refresh_token) {
      try {
        await window.sbClient.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      } catch (err) {
        console.warn('Could not set Supabase client session:', err);
      }
    }
  },

  async register(email, password, fullName, currency = 'USD') {
    try {
      // 1. Attempt registration via Express API backend
      const res = await Api.post('/auth/register', { email, password, fullName, currency });
      if (res.data?.session?.access_token) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, res.data.session.access_token);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(res.data.user));
        if (res.data.profile) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.PROFILE, JSON.stringify(res.data.profile));
        }
        await this.syncSupabaseSession(res.data.session);
      } else if (res.data?.user) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(res.data.user));
      }
      return res;
    } catch (err) {
      // If server is unreachable or backend fetch fails, fallback to direct Supabase SDK
      const isNetworkError = err.message.includes('Failed to fetch') ||
                             err.name === 'TypeError' ||
                             err.message.includes('NetworkError');

      if (window.sbClient && isNetworkError) {
        console.info('[Direct Supabase Mode] Registering user directly via Supabase Auth.');
        const { data, error } = await window.sbClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              currency: currency
            }
          }
        });
        if (error) throw error;

        if (data.session) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.session.access_token);
          localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
          await this.syncSupabaseSession(data.session);

          try {
            await window.sbClient.from('profiles').upsert({
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              currency: currency
            });
          } catch (e) {
            console.warn('Profile direct sync notice:', e);
          }
        }

        const profile = { id: data.user?.id, email: data.user?.email, full_name: fullName, currency };
        localStorage.setItem(CONFIG.STORAGE_KEYS.PROFILE, JSON.stringify(profile));

        return { data };
      }
      throw err;
    }
  },

  async login(email, password) {
    try {
      // 1. Attempt login via Express API backend
      const res = await Api.post('/auth/login', { email, password });
      if (res.data?.session?.access_token) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, res.data.session.access_token);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(res.data.user));
        if (res.data.profile) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.PROFILE, JSON.stringify(res.data.profile));
        }
        await this.syncSupabaseSession(res.data.session);
      }
      return res;
    } catch (err) {
      // If server is unreachable or backend fetch fails, fallback to direct Supabase SDK
      const isNetworkError = err.message.includes('Failed to fetch') ||
                             err.name === 'TypeError' ||
                             err.message.includes('NetworkError');

      if (window.sbClient && isNetworkError) {
        console.info('[Direct Supabase Mode] Signing in directly via Supabase Auth.');
        const { data, error } = await window.sbClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.session) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.session.access_token);
          localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
          await this.syncSupabaseSession(data.session);

          try {
            const { data: profile } = await window.sbClient
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            if (profile) {
              localStorage.setItem(CONFIG.STORAGE_KEYS.PROFILE, JSON.stringify(profile));
            } else {
              const fallbackProfile = {
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || '',
                currency: data.user.user_metadata?.currency || 'USD'
              };
              localStorage.setItem(CONFIG.STORAGE_KEYS.PROFILE, JSON.stringify(fallbackProfile));
            }
          } catch (e) {
            console.warn('Could not fetch profile in direct mode:', e);
          }
        }
        return { data };
      }
      throw err;
    }
  },

  async logout() {
    if (window.sbClient) {
      try {
        await window.sbClient.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.PROFILE);
    window.location.href = 'login.html';
  },

  renderUserNav() {
    const user = this.getUser();
    const profile = this.getProfile();
    const nameEl = document.getElementById('nav-user-name');
    const emailEl = document.getElementById('nav-user-email');
    const avatarEl = document.getElementById('nav-user-avatar');

    if (nameEl) nameEl.textContent = profile?.full_name || user?.user_metadata?.full_name || 'Student';
    if (emailEl) emailEl.textContent = user?.email || profile?.email || '';
    if (avatarEl) {
      const initial = (profile?.full_name || user?.email || 'S').charAt(0).toUpperCase();
      avatarEl.textContent = initial;
    }
  }
};

window.Auth = Auth;
