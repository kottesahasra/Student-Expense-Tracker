const { supabase, supabaseAdmin, getScopedClient } = require('../config/supabase');

class AuthService {
  async register({ email, password, fullName, currency = 'USD' }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
          currency: currency
        }
      }
    });

    if (authError) throw authError;

    const user = authData.user;
    if (!user) throw new Error('Registration failed, no user returned.');

    // Determine the most privileged client available for profile synchronization
    let dbClient = supabaseAdmin;
    if (!dbClient && authData.session?.access_token) {
      dbClient = getScopedClient(authData.session.access_token);
    }
    if (!dbClient) {
      dbClient = supabase;
    }

    let profile = null;
    try {
      const { data: profileRecord, error: profileError } = await dbClient
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: fullName || '',
          currency: currency
        })
        .select()
        .maybeSingle();

      if (profileError) {
        console.warn('Profile sync notice (may be managed by database trigger):', profileError.message);
      } else {
        profile = profileRecord;
      }
    } catch (err) {
      console.warn('Profile upsert exception:', err.message);
    }

    if (!profile) {
      profile = {
        id: user.id,
        email: user.email,
        full_name: fullName || '',
        currency: currency
      };
    }

    return {
      user,
      session: authData.session,
      profile
    };
  }

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Fetch user profile using user-scoped client to satisfy RLS (auth.uid() = id)
    const userClient = data.session?.access_token
      ? getScopedClient(data.session.access_token)
      : (supabaseAdmin || supabase);

    const { data: profile, error: profileErr } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileErr) {
      console.warn('Profile fetch notice:', profileErr.message);
    }

    return {
      user: data.user,
      session: data.session,
      profile: profile || {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || '',
        currency: data.user.user_metadata?.currency || 'USD'
      }
    };
  }

  async getProfile(scopedClient, userId) {
    const { data, error } = await scopedClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateProfile(scopedClient, userId, updates) {
    const payload = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.monthlyBudgetTarget !== undefined) payload.monthly_budget_target = updates.monthlyBudgetTarget;

    const { data, error } = await scopedClient
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new AuthService();

