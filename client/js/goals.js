document.addEventListener('DOMContentLoaded', async () => {
  Auth.renderUserNav();

  const gridContainer = document.getElementById('goals-grid');

  async function loadGoals() {
    try {
      const res = await Api.get('/goals');
      if (res.data) {
        renderGoals(res.data);
      }
    } catch (err) {
      Utils.showToast('Failed to load savings goals: ' + err.message, 'error');
    }
  }

  function renderGoals(goals) {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    if (!goals || goals.length === 0) {
      gridContainer.innerHTML = `
        <div class="card text-center py-8" style="grid-column: 1 / -1;">
          <p class="text-muted mb-4">No savings goals set yet. Build your emergency fund or plan for your next big college expense!</p>
          <button class="btn btn-primary" onclick="openNewGoalModal()">Create Your First Goal</button>
        </div>
      `;
      return;
    }

    goals.forEach(g => {
      const isCompleted = g.isCompleted || g.status === 'completed';
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="d-flex justify-between align-center mb-2">
          <span class="badge ${isCompleted ? 'badge-income' : 'badge-warning'}">
            ${isCompleted ? 'Target Reached!' : `${g.progress}% Complete`}
          </span>
          <span class="text-muted" style="font-size: var(--font-size-xs)">
            ${g.target_date ? `Due ${Utils.formatDate(g.target_date)}` : 'Ongoing'}
          </span>
        </div>

        <h3 class="card-title mb-2">${g.title}</h3>
        <p class="text-muted" style="font-size: var(--font-size-xs); margin-bottom: var(--space-4);">${g.category || 'General Fund'}</p>

        <div class="progress-container">
          <div class="progress-bar ${isCompleted ? 'success' : ''}" style="width: ${Math.min(g.progress, 100)}%;"></div>
        </div>

        <div class="d-flex justify-between mt-4" style="font-size: var(--font-size-sm)">
          <div>
            <div class="text-muted">Saved</div>
            <div class="font-bold text-success">${Utils.formatCurrency(g.current_amount)}</div>
          </div>
          <div class="text-right">
            <div class="text-muted">Target Goal</div>
            <div class="font-bold">${Utils.formatCurrency(g.target_amount)}</div>
          </div>
        </div>

        <div class="d-flex justify-between align-center mt-6 pt-4" style="border-top: 1px solid var(--border-light)">
          <button class="btn btn-primary btn-sm" onclick="openContributeModal('${g.id}', '${g.title}')">
            + Add Funds
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteGoal('${g.id}')">
            Delete
          </button>
        </div>
      `;
      gridContainer.appendChild(card);
    });
  }

  // Create Goal Form handler
  const goalForm = document.getElementById('goal-form');
  if (goalForm) {
    goalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('goal-title').value.trim();
      const target_amount = parseFloat(document.getElementById('goal-target').value);
      const current_amount = parseFloat(document.getElementById('goal-current').value) || 0;
      const target_date = document.getElementById('goal-date').value || null;
      const category = document.getElementById('goal-category').value.trim() || 'General';

      try {
        await Api.post('/goals', { title, target_amount, current_amount, target_date, category });
        Utils.showToast('Goal created successfully!', 'success');
        Utils.closeModal('goal-modal');
        goalForm.reset();
        await loadGoals();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to create goal', 'error');
      }
    });
  }

  // Contribute Form handler
  const contributeForm = document.getElementById('contribute-form');
  if (contributeForm) {
    contributeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('contribute-goal-id').value;
      const amount = parseFloat(document.getElementById('contribute-amount').value);

      if (isNaN(amount) || amount <= 0) {
        Utils.showToast('Please enter a valid contribution amount', 'error');
        return;
      }

      try {
        await Api.post(`/goals/${id}/contribute`, { amount });
        Utils.showToast('Contribution added to savings goal!', 'success');
        Utils.closeModal('contribute-modal');
        contributeForm.reset();
        await loadGoals();
      } catch (err) {
        Utils.showToast(err.message || 'Contribution failed', 'error');
      }
    });
  }

  window.openNewGoalModal = () => {
    const form = document.getElementById('goal-form');
    if (form) form.reset();
    Utils.openModal('goal-modal');
  };

  window.openContributeModal = (goalId, goalTitle) => {
    document.getElementById('contribute-goal-id').value = goalId;
    document.getElementById('contribute-goal-title').textContent = goalTitle;
    document.getElementById('contribute-amount').value = '';
    Utils.openModal('contribute-modal');
  };

  window.deleteGoal = async (id) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await Api.delete(`/goals/${id}`);
      Utils.showToast('Savings goal deleted', 'success');
      await loadGoals();
    } catch (err) {
      Utils.showToast(err.message || 'Delete failed', 'error');
    }
  };

  await loadGoals();
});

