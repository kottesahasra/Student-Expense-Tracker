document.addEventListener('DOMContentLoaded', async () => {
  Auth.renderUserNav();

  let trendsChart = null;
  let categoryPieChart = null;

  async function loadAnalytics() {
    try {
      const summaryRes = await Api.get('/analytics/summary');
      const trendsRes = await Api.get('/analytics/trends', { months: 6 });

      if (summaryRes.data) {
        renderMetrics(summaryRes.data.summary);
        renderCategoryBreakdown(summaryRes.data.categorySpending);
      }

      if (trendsRes.data) {
        renderTrends(trendsRes.data);
      }
    } catch (err) {
      Utils.showToast('Failed to load analytics: ' + err.message, 'error');
    }
  }

  function renderMetrics(summary) {
    document.getElementById('analytics-income').textContent = Utils.formatCurrency(summary.totalIncome);
    document.getElementById('analytics-expense').textContent = Utils.formatCurrency(summary.totalExpense);
    document.getElementById('analytics-savings').textContent = Utils.formatCurrency(summary.netSavings);
    document.getElementById('analytics-rate').textContent = `${summary.savingsRate}%`;
    document.getElementById('analytics-daily-avg').textContent = Utils.formatCurrency(summary.dailyAverageExpense);
  }

  function renderCategoryBreakdown(categories) {
    const ctx = document.getElementById('analyticsPieChart')?.getContext('2d');
    const tableBody = document.getElementById('category-breakdown-tbody');
    if (!ctx) return;

    if (categoryPieChart) categoryPieChart.destroy();

    const labels = categories.map(c => c.name);
    const data = categories.map(c => c.total);
    const colors = categories.map(c => c.color || '#6366f1');

    categoryPieChart = new Chart(ctx, {
      type: 'pie',
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
          legend: { position: 'right' }
        }
      }
    });

    if (tableBody) {
      tableBody.innerHTML = '';
      const totalExpense = categories.reduce((sum, c) => sum + c.total, 0);

      categories.forEach(c => {
        const pct = totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="d-flex align-center gap-2">
              <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:${c.color}"></span>
              <strong>${c.name}</strong>
            </div>
          </td>
          <td>${Utils.formatCurrency(c.total)}</td>
          <td>${pct}%</td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  function renderTrends(trends) {
    const ctx = document.getElementById('analyticsTrendsChart')?.getContext('2d');
    if (!ctx) return;

    if (trendsChart) trendsChart.destroy();

    const labels = trends.map(t => t.label);
    const incomeData = trends.map(t => t.income);
    const expenseData = trends.map(t => t.expense);
    const savingsData = trends.map(t => t.savings);

    trendsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Net Savings',
            data: savingsData,
            borderColor: '#3b82f6',
            borderDash: [5, 5],
            tension: 0.3,
            fill: false
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
              callback: val => '$' + val
            }
          }
        }
      }
    });
  }

  await loadAnalytics();
});

