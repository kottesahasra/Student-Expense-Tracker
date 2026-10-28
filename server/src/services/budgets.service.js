class BudgetsService {
  async getBudgets(scopedClient, userId, month, year) {
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    // 1. Get all budgets for user in that period
    const { data: budgets, error: budgetError } = await scopedClient
      .from('budgets')
      .select('*, categories(id, name, icon, color)')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear);

    if (budgetError) throw budgetError;

    // 2. Fetch actual expenses in that month to calculate progress
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    // Find last day of month
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: expenses, error: expError } = await scopedClient
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    if (expError) throw expError;

    // Aggregate expenses by category
    const spendingMap = {};
    (expenses || []).forEach(tx => {
      if (tx.category_id) {
        spendingMap[tx.category_id] = (spendingMap[tx.category_id] || 0) + Number(tx.amount);
      }
    });

    // Merge spending into budgets
    const budgetsWithProgress = budgets.map(b => {
      const spent = spendingMap[b.category_id] || 0;
      const limit = Number(b.amount_limit);
      const remaining = Math.max(0, limit - spent);
      const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
      const isOverBudget = spent > limit;

      return {
        ...b,
        spent: Number(spent.toFixed(2)),
        remaining: Number(remaining.toFixed(2)),
        percentage,
        isOverBudget
      };
    });

    return {
      month: currentMonth,
      year: currentYear,
      budgets: budgetsWithProgress
    };
  }

  async setBudget(scopedClient, userId, { category_id, amount_limit, month, year }) {
    const payload = {
      user_id: userId,
      category_id,
      amount_limit,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear()
    };

    const { data, error } = await scopedClient
      .from('budgets')
      .upsert(payload, { onConflict: 'user_id,category_id,month,year' })
      .select('*, categories(id, name, icon, color)')
      .single();

    if (error) throw error;
    return data;
  }

  async updateBudget(scopedClient, userId, id, amount_limit) {
    const { data, error } = await scopedClient
      .from('budgets')
      .update({ amount_limit })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, categories(id, name, icon, color)')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBudget(scopedClient, userId, id) {
    const { error } = await scopedClient
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { id, deleted: true };
  }
}

module.exports = new BudgetsService();

