class RecurringService {
  async getRecurring(scopedClient, userId) {
    const { data, error } = await scopedClient
      .from('recurring_transactions')
      .select('*, categories(id, name, icon, color), accounts(id, name, type)')
      .eq('user_id', userId)
      .order('next_due_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createRecurring(scopedClient, userId, payload) {
    const { data, error } = await scopedClient
      .from('recurring_transactions')
      .insert({
        user_id: userId,
        title: payload.title,
        amount: payload.amount,
        type: payload.type,
        category_id: payload.category_id || null,
        account_id: payload.account_id || null,
        frequency: payload.frequency,
        start_date: payload.start_date || new Date().toISOString().split('T')[0],
        next_due_date: payload.next_due_date,
        is_active: true
      })
      .select('*, categories(id, name, icon, color), accounts(id, name, type)')
      .single();

    if (error) throw error;
    return data;
  }

  async updateRecurring(scopedClient, userId, id, payload) {
    const { data, error } = await scopedClient
      .from('recurring_transactions')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, categories(id, name, icon, color), accounts(id, name, type)')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRecurring(scopedClient, userId, id) {
    const { error } = await scopedClient
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { id, deleted: true };
  }

  /**
   * Generates a concrete transaction from a due recurring item and calculates next due date.
   */
  async processRecurring(scopedClient, userId, id) {
    const { data: item, error: fetchErr } = await scopedClient
      .from('recurring_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !item) throw new Error('Recurring item not found');

    // 1. Create transaction
    const { data: transaction, error: txErr } = await scopedClient
      .from('transactions')
      .insert({
        user_id: userId,
        title: item.title,
        amount: item.amount,
        type: item.type,
        category_id: item.category_id,
        account_id: item.account_id,
        date: item.next_due_date,
        description: `Automated recurring item: ${item.frequency}`
      })
      .select()
      .single();

    if (txErr) throw txErr;

    // 2. Advance next due date based on frequency
    const nextDate = this.calculateNextDueDate(item.next_due_date, item.frequency);

    const { data: updatedItem, error: updateErr } = await scopedClient
      .from('recurring_transactions')
      .update({ next_due_date: nextDate })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return { transaction, recurring: updatedItem };
  }

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
  }
}

module.exports = new RecurringService();

