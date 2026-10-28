document.addEventListener('DOMContentLoaded', async () => {
  Auth.renderUserNav();

  const currentDate = new Date();
  let selectedMonth = currentDate.getMonth() + 1;
  let selectedYear = currentDate.getFullYear();

  const monthSelect = document.getElementById('budget-month-select');
  const yearSelect = document.getElementById('budget-year-select');
  const gridContainer = document.getElementById('budgets-grid');

  // Populate month & year dropdowns
  if (monthSelect) {
    monthSelect.value = selectedMonth;
    monthSelect.addEventListener('change', () => {
      selectedMonth = parseInt(monthSelect.value, 10);
      loadBudgets();
    });
  }

  if (yearSelect) {
    yearSelect.innerHTML = '';
    for (let y = selectedYear - 2; y <= selectedYear + 2; y++) {
      yearSelect.innerHTML += `<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>`;
    }
    yearSelect.addEventListener('change', () => {
      selectedYear = parseInt(yearSelect.value, 10);
      loadBudgets();
    });
  }

  // Populate Categories in Budget Modal
  async function loadExpenseCategories() {
    try {
      const res = await Api.get('/categories', { type: 'expense' });
      const select = document.getElementById('budget-category');
      if (select && res.data) {
        select.innerHTML = '<option value="">Select Category</option>';
        res.data.forEach(c => {
          select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
      }
    } catch (e) {
      console.warn('Could not load categories:', e);
    }
  }

  async function loadBudgets() {
    try {
      const res = await Api.get('/budgets', { month: selectedMonth, year: selectedYear });
      if (res.data) {
        renderBudgets(res.data.budgets);
      }
    } catch (err) {
      Utils.showToast('Failed to load budgets: ' + err.message, 'error');
    }
  }

  function renderBudgets(budgets) {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    if (!budgets || budgets.length === 0) {
      gridContainer.innerHTML = `
        <div class="card text-center py-8" style="grid-column: 1 / -1;">
          <p class="text-muted mb-4">No budget limits defined for this month.</p>
          <button class="btn btn-primary" onclick="openNewBudgetModal()">Set Your First Category Budget</button>
        </div>
      `;
      return;
    }

    let totalBudget = 0;
    let totalSpent = 0;

    budgets.forEach(b => {
      totalBudget += Number(b.amount_limit);
      totalSpent += Number(b.spent);

      const isOver = b.isOverBudget;
      const progressClass = isOver ? 'danger' : (b.percentage > 75 ? 'warning' : '');

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="d-flex justify-between align-center mb-2">
          <div class="d-flex align-center gap-2">
            <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:${b.categories?.color || '#6366f1'}"></span>
            <h4 class="font-bold">${b.categories?.name || 'Category'}</h4>
          </div>
          <span class="badge ${isOver ? 'badge-expense' : 'badge-income'}">
            ${isOver ? 'Over Budget' : `${b.percentage}% Used`}
          </span>
        </div>

        <div class="progress-container">
          <div class="progress-bar ${progressClass}" style="width: ${Math.min(b.percentage, 100)}%;"></div>
        </div>

        <div class="d-flex justify-between mt-4" style="font-size: var(--font-size-sm)">
          <div>
            <div class="text-muted">Spent</div>
            <div class="font-bold ${isOver ? 'text-danger' : ''}">${Utils.formatCurrency(b.spent)}</div>
          </div>
          <div class="text-right">
            <div class="text-muted">Budget Limit</div>
            <div class="font-bold">${Utils.formatCurrency(b.amount_limit)}</div>
          </div>
        </div>

        <div class="d-flex justify-between align-center mt-4 pt-4" style="border-top: 1px solid var(--border-light)">
          <span class="text-muted" style="font-size: var(--font-size-xs)">
            ${isOver ? `Exceeded by ${Utils.formatCurrency(b.spent - b.amount_limit)}` : `${Utils.formatCurrency(b.remaining)} remaining`}
          </span>
          <div>
            <button class="btn btn-secondary btn-sm" onclick="editBudgetLimit('${b.id}', ${b.amount_limit})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteBudget('${b.id}')">Delete</button>
          </div>
        </div>
      `;
      gridContainer.appendChild(card);
    });

    // Update top summary cards if present
    const sumBudgetEl = document.getElementById('sum-total-budget');
    const sumSpentEl = document.getElementById('sum-total-spent');
    const sumRemainingEl = document.getElementById('sum-total-remaining');

    if (sumBudgetEl) sumBudgetEl.textContent = Utils.formatCurrency(totalBudget);
    if (sumSpentEl) sumSpentEl.textContent = Utils.formatCurrency(totalSpent);
    if (sumRemainingEl) sumRemainingEl.textContent = Utils.formatCurrency(Math.max(0, totalBudget - totalSpent));
  }

  // Budget form submit
  const budgetForm = document.getElementById('budget-form');
  if (budgetForm) {
    budgetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('budget-id').value;
      const category_id = document.getElementById('budget-category').value;
      const amount_limit = parseFloat(document.getElementById('budget-limit').value);

      try {
        if (id) {
          await Api.put(`/budgets/${id}`, { amount_limit });
          Utils.showToast('Budget updated successfully!', 'success');
        } else {
          await Api.post('/budgets', {
            category_id,
            amount_limit,
            month: selectedMonth,
            year: selectedYear
          });
          Utils.showToast('Budget configured successfully!', 'success');
        }
        Utils.closeModal('budget-modal');
        budgetForm.reset();
        await loadBudgets();
      } catch (err) {
        Utils.showToast(err.message || 'Operation failed', 'error');
      }
    });
  }

  // Edit / Delete helpers
  window.editBudgetLimit = (id, currentLimit) => {
    document.getElementById('budget-id').value = id;
    document.getElementById('budget-limit').value = currentLimit;
    const catGroup = document.getElementById('budget-category-group');
    if (catGroup) catGroup.style.display = 'none';
    document.getElementById('budget-modal-title').textContent = 'Edit Budget Limit';
    Utils.openModal('budget-modal');
  };

  window.deleteBudget = async (id) => {
    if (!confirm('Are you sure you want to remove this budget?')) return;
    try {
      await Api.delete(`/budgets/${id}`);
      Utils.showToast('Budget removed', 'success');
      await loadBudgets();
    } catch (err) {
      Utils.showToast(err.message || 'Failed to delete budget', 'error');
    }
  };

  window.openNewBudgetModal = () => {
    const form = document.getElementById('budget-form');
    if (form) form.reset();
    document.getElementById('budget-id').value = '';
    const catGroup = document.getElementById('budget-category-group');
    if (catGroup) catGroup.style.display = 'block';
    document.getElementById('budget-modal-title').textContent = 'Set Category Budget';
    Utils.openModal('budget-modal');
  };

  await loadExpenseCategories();
  await loadBudgets();
});

