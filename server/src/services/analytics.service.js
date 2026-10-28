class AnalyticsService {
  async getDashboardSummary(scopedClient, userId, month, year) {
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Get all transactions for current month
    const { data: monthTx, error } = await scopedClient
      .from('transactions')
      .select('*, categories(name, color, icon)')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {};

    (monthTx || []).forEach(tx => {
      const amt = Number(tx.amount);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else if (tx.type === 'expense') {
        totalExpense += amt;
        const catName = tx.categories?.name || 'Uncategorized';
        const catColor = tx.categories?.color || '#94a3b8';
        if (!categoryBreakdown[catName]) {
          categoryBreakdown[catName] = { name: catName, total: 0, color: catColor };
        }
        categoryBreakdown[catName].total += amt;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    const daysElapsed = Math.min(new Date().getDate(), lastDay);
    const dailyAverageExpense = daysElapsed > 0 ? Number((totalExpense / daysElapsed).toFixed(2)) : 0;

    // Convert categoryBreakdown object to array sorted by total desc
    const categorySpending = Object.values(categoryBreakdown).sort((a, b) => b.total - a.total);

    return {
      period: { month: currentMonth, year: currentYear },
      summary: {
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpense: Number(totalExpense.toFixed(2)),
        netSavings: Number(netSavings.toFixed(2)),
        savingsRate,
        dailyAverageExpense
      },
      categorySpending
    };
  }

  async getMonthlyTrend(scopedClient, userId, monthsBack = 6) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - (monthsBack - 1), 1)
      .toISOString().split('T')[0];

    const { data: transactions, error } = await scopedClient
      .from('transactions')
      .select('amount, type, date')
      .eq('user_id', userId)
      .gte('date', startDate)
      .order('date', { ascending: true });

    if (error) throw error;

    // Group by Month (YYYY-MM)
    const trends = {};
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      trends[key] = { monthKey: key, label, income: 0, expense: 0, savings: 0 };
    }

    (transactions || []).forEach(tx => {
      const key = tx.date.substring(0, 7);
      if (trends[key]) {
        if (tx.type === 'income') {
          trends[key].income += Number(tx.amount);
        } else if (tx.type === 'expense') {
          trends[key].expense += Number(tx.amount);
        }
      }
    });

    // Compute net savings per month
    const trendArray = Object.values(trends).map(t => ({
      ...t,
      income: Number(t.income.toFixed(2)),
      expense: Number(t.expense.toFixed(2)),
      savings: Number((t.income - t.expense).toFixed(2))
    }));

    return trendArray;
  }
}

module.exports = new AnalyticsService();

