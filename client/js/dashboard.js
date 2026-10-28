document.addEventListener('DOMContentLoaded', async () => {
  Auth.renderUserNav();

  let incomeExpenseChart = null;
  let categoryChart = null;

  async function loadDashboard() {
    try {
      // 1. Fetch Summary
      const summaryRes = await Api.get('/analytics/summary');
      if (summaryRes.data) {
        renderMetrics(summaryRes.data.summary);
        renderCategoryBreakdown(summaryRes.data.categorySpending);
      }

      // 2. Fetch Trends
      const trendsRes = await Api.get('/analytics/trends', { months: 6 });
      if (trendsRes.data) {
        renderTrendsChart(trendsRes.data);
      }

      // 3. Fetch Recent Transactions
      const txRes = await Api.get('/transactions', { limit: 5 });
      if (txRes.data) {
        renderRecentTransactions(txRes.data.transactions);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      Utils.showToast('Failed to load dashboard data: ' + err.message, 'error');
    }
  }

  function renderMetrics(summary) {
    const profile = Auth.getProfile();
    const curr = profile?.currency || 'USD';

    document.getElementById('metric-income').textContent = Utils.formatCurrency(summary.totalIncome, curr);
    document.getElementById('metric-expense').textContent = Utils.formatCurrency(summary.totalExpense, curr);
    document.getElementById('metric-savings').textContent = Utils.formatCurrency(summary.netSavings, curr);
    document.getElementById('metric-savings-rate').textContent = `${summary.savingsRate}%`;
  }

  function renderCategoryBreakdown(categories) {
    const ctx = document.getElementById('categoryDoughnutChart')?.getContext('2d');
    const container = document.getElementById('category-list-container');
    if (!ctx || !container) return;

    container.innerHTML = '';

    if (!categories || categories.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-4">No expense transactions recorded this month.</p>';
      return;
    }

    const labels = categories.map(c => c.name);
    const data = categories.map(c => c.total);
    const colors = categories.map(c => c.color || '#6366f1');

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        cutout: '70%'
      }
    });

    // Render list
    categories.slice(0, 5).forEach(c => {
      const item = document.createElement('div');
      item.className = 'category-item';
      item.innerHTML = `
        <div class="category-info">
          <span class="category-dot" style="background-color: ${c.color}"></span>
          <span class="font-medium">${c.name}</span>
        </div>
        <span class="font-semibold">${Utils.formatCurrency(c.total)}</span>
      `;
      container.appendChild(item);
    });
  }

  function renderTrendsChart(trends) {
    const ctx = document.getElementById('incomeExpenseTrendChart')?.getContext('2d');
    if (!ctx) return;

    const labels = trends.map(t => t.label);
    const incomeData = trends.map(t => t.income);
    const expenseData = trends.map(t => t.expense);

    if (incomeExpenseChart) incomeExpenseChart.destroy();

    incomeExpenseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: '#10b981',
            borderRadius: 6
          },
          {
            label: 'Expenses',
            data: expenseData,
            backgroundColor: '#ef4444',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => '$' + value
            }
          }
        }
      }
    });
  }

  function renderRecentTransactions(transactions) {
    const tbody = document.getElementById('recent-transactions-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!transactions || transactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No recent transactions.</td></tr>';
      return;
    }

    transactions.forEach(tx => {
      const isExpense = tx.type === 'expense';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="font-medium">${tx.title}</div>
          <div class="text-muted" style="font-size: 0.75rem">${tx.categories?.name || 'General'}</div>
        </td>
        <td>${Utils.formatDate(tx.date)}</td>
        <td>
          <span class="badge ${isExpense ? 'badge-expense' : 'badge-income'}">
            ${isExpense ? 'Expense' : 'Income'}
          </span>
        </td>
        <td class="font-bold ${isExpense ? 'text-danger' : 'text-success'}">
          ${isExpense ? '-' : '+'}${Utils.formatCurrency(tx.amount)}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Initial load
  await loadDashboard();

  // Populate Categories in Quick Add Transaction Modal
  try {
    const catRes = await Api.get('/categories');
    const select = document.getElementById('tx-category-select');
    if (select && catRes.data) {
      select.innerHTML = '<option value="">Select Category</option>';
      catRes.data.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name} (${c.type})</option>`;
      });
    }
  } catch (e) {
    console.warn('Could not load categories:', e);
  }

  // Quick Add Transaction form handler
  const txForm = document.getElementById('quick-tx-form');
  if (txForm) {
    txForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('tx-title').value.trim();
      const amount = parseFloat(document.getElementById('tx-amount').value);
      const type = document.getElementById('tx-type').value;
      const category_id = document.getElementById('tx-category-select').value || null;
      const date = document.getElementById('tx-date').value || new Date().toISOString().split('T')[0];

      if (!title || isNaN(amount) || amount <= 0) {
        Utils.showToast('Please provide a valid title and positive amount', 'error');
        return;
      }

      try {
        await Api.post('/transactions', { title, amount, type, category_id, date });
        Utils.showToast('Transaction added successfully!', 'success');
        Utils.closeModal('transaction-modal');
        txForm.reset();
        await loadDashboard();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to add transaction', 'error');
      }
    });
  }
});

