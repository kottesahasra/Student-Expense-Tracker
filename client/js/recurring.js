document.addEventListener('DOMContentLoaded', async () => {
  Auth.renderUserNav();

  const tbody = document.getElementById('recurring-tbody');

  // Populate categories in modal
  async function loadCategories() {
    try {
      const res = await Api.get('/categories');
      const select = document.getElementById('rec-category');
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

  async function loadRecurring() {
    try {
      const res = await Api.get('/recurring');
      if (res.data) {
        renderRecurring(res.data);
      }
    } catch (err) {
      Utils.showToast('Failed to load recurring items: ' + err.message, 'error');
    }
  }

  function renderRecurring(items) {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!items || items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-6">No recurring subscriptions or bills configured.</td></tr>';
      return;
    }

    items.forEach(item => {
      const isExpense = item.type === 'expense';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.title}</strong></td>
        <td>
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${item.categories?.color || '#94a3b8'}; margin-right:6px;"></span>
          ${item.categories?.name || 'Uncategorized'}
        </td>
        <td class="font-bold ${isExpense ? 'text-danger' : 'text-success'}">
          ${isExpense ? '-' : '+'}${Utils.formatCurrency(item.amount)}
        </td>
        <td><span class="badge" style="background:#e0e7ff; color:#4338ca;">${item.frequency}</span></td>
        <td><strong>${Utils.formatDate(item.next_due_date)}</strong></td>
        <td>
          <span class="badge ${item.is_active ? 'badge-income' : 'badge-warning'}">
            ${item.is_active ? 'Active' : 'Paused'}
          </span>
        </td>
        <td class="text-right">
          <button class="btn btn-primary btn-sm" onclick="processRecurring('${item.id}')" title="Log transaction today and advance due date">Pay / Log Now</button>
          <button class="btn btn-secondary btn-sm" onclick="toggleActive('${item.id}', ${!item.is_active})">${item.is_active ? 'Pause' : 'Resume'}</button>
          <button class="btn btn-danger btn-sm" onclick="deleteRecurring('${item.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Create Recurring form
  const form = document.getElementById('recurring-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('rec-title').value.trim();
      const amount = parseFloat(document.getElementById('rec-amount').value);
      const type = document.getElementById('rec-type').value;
      const category_id = document.getElementById('rec-category').value || null;
      const frequency = document.getElementById('rec-frequency').value;
      const next_due_date = document.getElementById('rec-due-date').value;

      try {
        await Api.post('/recurring', { title, amount, type, category_id, frequency, next_due_date });
        Utils.showToast('Recurring item added!', 'success');
        Utils.closeModal('recurring-modal');
        form.reset();
        await loadRecurring();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to add recurring item', 'error');
      }
    });
  }

  window.openNewRecurringModal = () => {
    const f = document.getElementById('recurring-form');
    if (f) f.reset();
    document.getElementById('rec-due-date').value = new Date().toISOString().split('T')[0];
    Utils.openModal('recurring-modal');
  };

  window.processRecurring = async (id) => {
    if (!confirm('Log this recurring bill as a completed transaction now?')) return;
    try {
      await Api.post(`/recurring/${id}/process`);
      Utils.showToast('Transaction logged and next due date updated!', 'success');
      await loadRecurring();
    } catch (err) {
      Utils.showToast(err.message || 'Processing failed', 'error');
    }
  };

  window.toggleActive = async (id, newStatus) => {
    try {
      await Api.put(`/recurring/${id}`, { is_active: newStatus });
      Utils.showToast(`Subscription ${newStatus ? 'resumed' : 'paused'}`, 'info');
      await loadRecurring();
    } catch (err) {
      Utils.showToast(err.message || 'Update failed', 'error');
    }
  };

  window.deleteRecurring = async (id) => {
    if (!confirm('Are you sure you want to delete this recurring item?')) return;
    try {
      await Api.delete(`/recurring/${id}`);
      Utils.showToast('Recurring item deleted', 'success');
      await loadRecurring();
    } catch (err) {
      Utils.showToast(err.message || 'Delete failed', 'error');
    }
  };

  await loadCategories();
  await loadRecurring();
});

