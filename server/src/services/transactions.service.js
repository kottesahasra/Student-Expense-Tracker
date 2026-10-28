class TransactionsService {
  async getTransactions(scopedClient, userId, filters = {}) {
    let query = scopedClient
      .from('transactions')
      .select('*, categories(id, name, icon, color), accounts(id, name, type)', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return { transactions: data, total: count, limit, offset };
  }

  async getTransactionById(scopedClient, userId, id) {
    const { data, error } = await scopedClient
      .from('transactions')
      .select('*, categories(id, name, icon, color), accounts(id, name, type)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async createTransaction(scopedClient, userId, payload) {
    const record = {
      user_id: userId,
      title: payload.title,
      amount: payload.amount,
      type: payload.type,
      category_id: payload.category_id || null,
      account_id: payload.account_id || null,
      date: payload.date || new Date().toISOString().split('T')[0],
      description: payload.description || null,
      tags: payload.tags || []
    };

    const { data, error } = await scopedClient
      .from('transactions')
      .insert(record)
      .select('*, categories(id, name, icon, color), accounts(id, name, type)')
      .single();

    if (error) throw error;

    // Optionally update account balance if account_id is present
    if (payload.account_id) {
      const balanceChange = payload.type === 'income' ? payload.amount : -payload.amount;
      await this.adjustAccountBalance(scopedClient, payload.account_id, balanceChange);
    }

    return data;
  }

  async updateTransaction(scopedClient, userId, id, payload) {
    // Fetch previous to compute balance delta if needed
    const { data: existing, error: getErr } = await scopedClient
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (getErr || !existing) throw new Error('Transaction not found or unauthorized');

    const sanitized = { ...payload };
    if ('category_id' in sanitized && !sanitized.category_id) {
      sanitized.category_id = null;
    }
    if ('account_id' in sanitized && !sanitized.account_id) {
      sanitized.account_id = null;
    }

    const { data, error } = await scopedClient
      .from('transactions')
      .update(sanitized)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, categories(id, name, icon, color), accounts(id, name, type)')
      .single();

    if (error) throw error;

    // Adjust balance delta if amount, type, or account changed
    if (existing.account_id || sanitized.account_id) {
      if (existing.account_id === sanitized.account_id) {
        const oldDelta = existing.type === 'income' ? Number(existing.amount) : -Number(existing.amount);
        const newDelta = (sanitized.type || existing.type) === 'income'
          ? Number(sanitized.amount !== undefined ? sanitized.amount : existing.amount)
          : -Number(sanitized.amount !== undefined ? sanitized.amount : existing.amount);
        const netAdjustment = newDelta - oldDelta;
        if (netAdjustment !== 0) {
          await this.adjustAccountBalance(scopedClient, existing.account_id, netAdjustment);
        }
      } else {
        if (existing.account_id) {
          const reverseOld = existing.type === 'income' ? -Number(existing.amount) : Number(existing.amount);
          await this.adjustAccountBalance(scopedClient, existing.account_id, reverseOld);
        }
        if (sanitized.account_id) {
          const appliedNew = (sanitized.type || existing.type) === 'income'
            ? Number(sanitized.amount !== undefined ? sanitized.amount : existing.amount)
            : -Number(sanitized.amount !== undefined ? sanitized.amount : existing.amount);
          await this.adjustAccountBalance(scopedClient, sanitized.account_id, appliedNew);
        }
      }
    }

    return data;
  }

  async deleteTransaction(scopedClient, userId, id) {
    // Reverse balance change if associated with account
    const { data: existing } = await scopedClient
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (existing && existing.account_id) {
      const reverseChange = existing.type === 'income' ? -existing.amount : existing.amount;
      await this.adjustAccountBalance(scopedClient, existing.account_id, reverseChange);
    }

    const { error } = await scopedClient
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { id, deleted: true };
  }

  async adjustAccountBalance(scopedClient, accountId, delta) {
    try {
      const { data: account } = await scopedClient
        .from('accounts')
        .select('balance')
        .eq('id', accountId)
        .single();

      if (account) {
        const newBalance = Number(account.balance) + Number(delta);
        await scopedClient
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', accountId);
      }
    } catch (e) {
      console.warn('Could not update account balance:', e.message);
    }
  }
}

module.exports = new TransactionsService();

