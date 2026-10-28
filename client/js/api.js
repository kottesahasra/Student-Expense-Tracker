// Initialize direct Supabase client if Supabase JS SDK is loaded
if (window.supabase && window.CONFIG && window.CONFIG.SUPABASE_URL && window.CONFIG.SUPABASE_ANON_KEY) {
  try {
    window.sbClient = window.supabase.createClient(
      window.CONFIG.SUPABASE_URL,
      window.CONFIG.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      }
    );
  } catch (err) {
    console.warn('Could not initialize direct Supabase client:', err);
  }
}

const Api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const url = `${CONFIG.API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
          localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
          localStorage.removeItem(CONFIG.STORAGE_KEYS.PROFILE);
          if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html') && !window.location.pathname.endsWith('index.html')) {
            window.location.href = 'login.html';
          }
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      // If server is not running or unreachable, fallback directly to Supabase client if available
      const isNetworkError = error.message.includes('Failed to fetch') ||
                             error.name === 'TypeError' ||
                             error.message.includes('NetworkError');

      if (window.sbClient && isNetworkError) {
        console.info(`[Direct Supabase Mode] Executing ${endpoint} directly via Supabase SDK.`);
        return await this.executeDirectSupabase(endpoint, options);
      }
      console.error(`API request error on [${options.method || 'GET'}] ${endpoint}:`, error);
      throw error;
    }
  },

  calculateNextDueDate(currentDateStr, frequency) {
    const parts = (currentDateStr || '').split('-');
    if (parts.length !== 3) {
      const fallback = new Date();
      fallback.setMonth(fallback.getMonth() + 1);
      return fallback.toISOString().split('T')[0];
    }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const date = new Date(Date.UTC(year, month, day));
    switch (frequency) {
      case 'daily':
        date.setUTCDate(date.getUTCDate() + 1);
        break;
      case 'weekly':
        date.setUTCDate(date.getUTCDate() + 7);
        break;
      case 'biweekly':
        date.setUTCDate(date.getUTCDate() + 14);
        break;
      case 'monthly':
        date.setUTCMonth(date.getUTCMonth() + 1);
        break;
      case 'semester':
        date.setUTCMonth(date.getUTCMonth() + 6);
        break;
      case 'yearly':
        date.setUTCFullYear(date.getUTCFullYear() + 1);
        break;
      default:
        date.setUTCMonth(date.getUTCMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  },

  async executeDirectSupabase(endpoint, options = {}) {
    const user = Auth.getUser();
    const userId = user?.id;
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};

    const urlObj = new URL(endpoint, 'http://localhost');
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // 1. Categories
    if (pathname.startsWith('/categories')) {
      if (method === 'GET') {
        const type = searchParams.get('type');
        let query = window.sbClient
          .from('categories')
          .select('*')
          .order('name', { ascending: true });

        if (type) {
          query = query.eq('type', type);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data };
      }

      if (method === 'POST') {
        const { data, error } = await window.sbClient
          .from('categories')
          .insert({
            user_id: userId,
            name: body.name,
            type: body.type,
            icon: body.icon || 'tag',
            color: body.color || '#4f46e5',
            is_default: false
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, data };
      }
    }

    // 2. Transactions
    if (pathname.startsWith('/transactions')) {
      if (method === 'GET') {
        const idMatch = pathname.match(/\/transactions\/([a-zA-Z0-9-]+)/);
        if (idMatch && idMatch[1] && idMatch[1] !== 'undefined') {
          const { data, error } = await window.sbClient
            .from('transactions')
            .select('*, categories(*)')
            .eq('id', idMatch[1])
            .eq('user_id', userId)
            .single();
          if (error) throw error;
          return { success: true, data };
        }

        let query = window.sbClient
          .from('transactions')
          .select('*, categories(*)', { count: 'exact' })
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const type = searchParams.get('type');
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);
        if (type) query = query.eq('type', type);
        if (categoryId) query = query.eq('category_id', categoryId);
        if (search) query = query.ilike('title', `%${search}%`);

        query = query.range(offset, offset + limit - 1);

        const { data, count, error } = await query;
        if (error) throw error;
        return { success: true, data: { transactions: data, total: count !== null ? count : (data?.length || 0) } };
      }

      if (method === 'POST') {
        const record = {
          user_id: userId,
          title: body.title,
          amount: Number(body.amount),
          type: body.type,
          category_id: body.category_id || null,
          account_id: body.account_id || null,
          date: body.date || new Date().toISOString().split('T')[0],
          description: body.description || null,
          tags: body.tags || []
        };
        const { data, error } = await window.sbClient
          .from('transactions')
          .insert(record)
          .select('*, categories(*)')
          .single();
        if (error) throw error;
        return { success: true, data };
      }

      if (method === 'PUT') {
        const id = pathname.split('/')[2];
        const updatePayload = { ...body };
        if ('category_id' in updatePayload && !updatePayload.category_id) {
          updatePayload.category_id = null;
        }
        if ('account_id' in updatePayload && !updatePayload.account_id) {
          updatePayload.account_id = null;
        }

        const { data, error } = await window.sbClient
          .from('transactions')
          .update(updatePayload)
          .eq('id', id)
          .eq('user_id', userId)
          .select('*, categories(*)')
          .single();
        if (error) throw error;
        return { success: true, data };
      }

      if (method === 'DELETE') {
        const id = pathname.split('/')[2];
        const { error } = await window.sbClient
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return { success: true, data: { id, deleted: true } };
      }
    }

    // 3. Budgets
    if (pathname.startsWith('/budgets')) {
      if (method === 'GET') {
        const monthParam = searchParams.get('month');
        const yearParam = searchParams.get('year');
        const currentMonth = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
        const currentYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

        const { data: budgets, error: bErr } = await window.sbClient
          .from('budgets')
          .select('*, categories(*)')
          .eq('user_id', userId)
          .eq('month', currentMonth)
          .eq('year', currentYear);
        if (bErr) throw bErr;

        // Fetch expenses strictly for this month period
        const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(currentYear, currentMonth, 0).getDate();
        const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const { data: expenses } = await window.sbClient
          .from('transactions')
          .select('category_id, amount')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('date', startDate)
          .lte('date', endDate);

        const spending = {};
        (expenses || []).forEach(e => {
          if (e.category_id) {
            spending[e.category_id] = (spending[e.category_id] || 0) + Number(e.amount);
          }
        });

        const enriched = (budgets || []).map(b => {
          const spent = spending[b.category_id] || 0;
          const limit = Number(b.amount_limit);
          const remaining = Math.max(0, limit - spent);
          const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          return {
            ...b,
            spent: Number(spent.toFixed(2)),
            remaining: Number(remaining.toFixed(2)),
            percentage,
            isOverBudget: spent > limit
          };
        });

        return { success: true, data: { month: currentMonth, year: currentYear, budgets: enriched } };
      }

      if (method === 'POST') {
        const payload = {
          user_id: userId,
          category_id: body.category_id,
          amount_limit: Number(body.amount_limit),
          month: body.month || new Date().getMonth() + 1,
          year: body.year || new Date().getFullYear()
        };

        const { data, error } = await window.sbClient
          .from('budgets')
          .upsert(payload, { onConflict: 'user_id,category_id,month,year' })
          .select('*, categories(*)')
          .single();
        if (error) throw error;
        return { success: true, data };
      }

      if (method === 'PUT') {
        const id = pathname.split('/')[2];
        const { data, error } = await window.sbClient
          .from('budgets')
          .update({ amount_limit: Number(body.amount_limit) })
          .eq('id', id)
          .eq('user_id', userId)
          .select('*, categories(*)')
          .single();
        if (error) throw error;
        return { success: true, data };
      }

      if (method === 'DELETE') {
        const id = pathname.split('/')[2];
        const { error } = await window.sbClient
          .from('budgets')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return { success: true, data: { id, deleted: true } };
      }
    }

    // 4. Goals
    if (pathname.startsWith('/goals')) {
      if (pathname.includes('/contribute')) {
        const id = pathname.split('/')[2];
        const { data: goal, error: gErr } = await window.sbClient
          .from('savings_goals')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();
        if (gErr || !goal) throw new Error('Goal not found');

        const newAmt = Number(goal.current_amount || 0) + Number(body.amount);
        const { data, error } = await window.sbClient
          .from('savings_goals')
          .update({
            current_amount: newAmt,
            status: newAmt >= Number(goal.target_amount) ? 'completed' : goal.status
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return { success: true, data };
      }

      if (method === 'GET') {
        const { data, error } = await window.sbClient
          .from('savings_goals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw error;

        const enriched = (data || []).map(g => {
          const cur = Number(g.current_amount || 0);
          const tgt = Number(g.target_amount || 0);
          return {
            ...g,
            progress: tgt > 0 ? Math.min(100, Math.round((cur / tgt) * 100)) : 0,
            isCompleted: cur >= tgt
          };
        });
        return { success: true, data: enriched };
      }

      if (method === 'POST') {
        const { data, error } = await window.sbClient
          .from('savings_goals')
          .insert({
            user_id: userId,
            title: body.title,
            target_amount: Number(body.target_amount),
            current_amount: Number(body.current_amount || 0),
            target_date: body.target_date || null,
            category: body.category || 'General',
            status: 'in_progress'
          })
          .select()
          .single();
        if (error) throw error;
        return { success: true, data };
      }

      if (method === 'DELETE') {
        const id = pathname.split('/')[2];
        const { error } = await window.sbClient
          .from('savings_goals')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return { success: true, data: { id, deleted: true } };
      }
    }

    // 5. Recurring
    if (pathname.startsWith('/recurring')) {
      if (pathname.includes('/process')) {
        const id = pathname.split('/')[2];
        const { data: rec, error: rErr } = await window.sbClient
          .from('recurring_transactions')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();
        if (rErr || !rec) throw new Error('Recurring item not found');

        // Create actual transaction
        await window.sbClient.from('transactions').insert({
          user_id: userId,
          title: rec.title,
          amount: rec.amount,
          type: rec.type,
          category_id: rec.category_id,
          account_id: rec.account_id,
          date: rec.next_due_date,
          description: `Automated recurring: ${rec.frequency}`
        });

        // Compute next due date based on frequency
        const nextDate = this.calculateNextDueDate(rec.next_due_date, rec.frequency);
        const { data: updatedItem } = await window.sbClient
          .from('recurring_transactions')
          .update({ next_due_date: nextDate })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        return { success: true, data: { recurring: updatedItem } };
      }

      if (method === 'GET') {
        const { data, error } = await window.sbClient
          .from('recurring_transactions')
          .select('*, categories(*)')
          .eq('user_id', userId)
          .order('next_due_date', { ascending: true });
        if (error) throw error;
        return { success: true, data };
      }

      if (method === 'POST') {
        const { data, error } = await window.sbClient
          .from('recurring_transactions')
          .insert({
            user_id: userId,
            title: body.title,
            amount: Number(body.amount),
            type: body.type,
            category_id: body.category_id || null,
            account_id: body.account_id || null,
            frequency: body.frequency,
            start_date: body.start_date || new Date().toISOString().split('T')[0],
            next_due_date: body.next_due_date,
            is_active: true
          })
          .select('*, categories(*)')
          .single();
        if (error) throw error;
        return { success: true, data };
      }

      if (method === 'PUT') {
        const id = pathname.split('/')[2];
        const updatePayload = { ...body };
        if ('category_id' in updatePayload && !updatePayload.category_id) updatePayload.category_id = null;
        if ('account_id' in updatePayload && !updatePayload.account_id) updatePayload.account_id = null;

        const { data, error } = await window.sbClient
          .from('recurring_transactions')
          .update(updatePayload)
          .eq('id', id)
          .eq('user_id', userId)
          .select('*, categories(*)')
          .single();
        if (error) throw error;
        return { success: true, data };
      }

      if (method === 'DELETE') {
        const id = pathname.split('/')[2];
        const { error } = await window.sbClient
          .from('recurring_transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return { success: true, data: { id, deleted: true } };
      }
    }

    // 6. Analytics
    if (pathname.startsWith('/analytics/summary')) {
      const monthParam = searchParams.get('month');
      const yearParam = searchParams.get('year');
      const currentMonth = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
      const currentYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const { data: txs, error } = await window.sbClient
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      let totalIncome = 0;
      let totalExpense = 0;
      const catMap = {};

      (txs || []).forEach(tx => {
        const amt = Number(tx.amount);
        if (tx.type === 'income') {
          totalIncome += amt;
        } else if (tx.type === 'expense') {
          totalExpense += amt;
          const name = tx.categories?.name || 'Uncategorized';
          const color = tx.categories?.color || '#94a3b8';
          if (!catMap[name]) catMap[name] = { name, total: 0, color };
          catMap[name].total += amt;
        }
      });

      const netSavings = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
      const daysElapsed = Math.min(new Date().getDate(), lastDay);
      const dailyAverageExpense = daysElapsed > 0 ? Number((totalExpense / daysElapsed).toFixed(2)) : 0;
      const categorySpending = Object.values(catMap).sort((a, b) => b.total - a.total);

      return {
        success: true,
        data: {
          period: { month: currentMonth, year: currentYear },
          summary: {
            totalIncome: Number(totalIncome.toFixed(2)),
            totalExpense: Number(totalExpense.toFixed(2)),
            netSavings: Number(netSavings.toFixed(2)),
            savingsRate,
            dailyAverageExpense
          },
          categorySpending
        }
      };
    }

    if (pathname.startsWith('/analytics/trends')) {
      const monthsBack = parseInt(searchParams.get('months') || '6', 10);
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - (monthsBack - 1), 1)
        .toISOString().split('T')[0];

      const { data: transactions, error } = await window.sbClient
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', userId)
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) throw error;

      const trends = {};
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        trends[key] = { monthKey: key, label, income: 0, expense: 0, savings: 0 };
      }

      (transactions || []).forEach(tx => {
        const key = (tx.date || '').substring(0, 7);
        if (trends[key]) {
          if (tx.type === 'income') trends[key].income += Number(tx.amount);
          else if (tx.type === 'expense') trends[key].expense += Number(tx.amount);
        }
      });

      const trendArray = Object.values(trends).map(t => ({
        ...t,
        income: Number(t.income.toFixed(2)),
        expense: Number(t.expense.toFixed(2)),
        savings: Number((t.income - t.expense).toFixed(2))
      }));

      return { success: true, data: trendArray };
    }

    // 7. Profile
    if (pathname.startsWith('/auth/profile')) {
      if (method === 'GET') {
        const { data, error } = await window.sbClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (error) throw error;
        return { success: true, data };
      }
      if (method === 'PUT') {
        const updatePayload = {};
        if (body.fullName !== undefined) updatePayload.full_name = body.fullName;
        if (body.currency !== undefined) updatePayload.currency = body.currency;
        if (body.monthlyBudgetTarget !== undefined) updatePayload.monthly_budget_target = body.monthlyBudgetTarget;

        const { data, error } = await window.sbClient
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId)
          .select()
          .single();
        if (error) throw error;
        return { success: true, data };
      }
    }

    throw new Error(`Unhandled direct Supabase request for [${method}] ${endpoint}`);
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

window.Api = Api;
